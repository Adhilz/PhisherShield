// backend/src/controllers/reportController.ts
import { Request, Response } from 'express';
import { reportsCollection } from '../models/Report'; // Firestore collection
import { performScanAndCalculateScore } from './scanController';
import * as admin from 'firebase-admin';
import { queryHana } from '../hanaClient'; // Import HANA client

// Extend Request type to include user property
declare global {
    namespace Express {
        interface Request {
            user?: admin.auth.DecodedIdToken;
        }
    }
}

// Middleware to verify Firebase ID Token
export const verifyIdToken = async (req: Request, res: Response, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token required.' });
    }

    const idToken = authHeader.split(' ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying ID token:', error);
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};

export const createReport = async (req: Request, res: Response) => {
    const { reportedUrl, reportDetails } = req.body;
    const user = req.user;

    if (!reportedUrl) {
        return res.status(400).json({ message: 'Reported URL is required.' });
    }

    if (!user || !user.uid) {
        return res.status(401).json({ message: 'Authentication required to submit a report.' });
    }

    let scanResultsData: any = {};
    try {
        const scanResponse = await performScanAndCalculateScore(reportedUrl, '');
        scanResultsData = {
            trustScore: scanResponse.trustScore,
            deductions: scanResponse.deductions
        };
    } catch (scanError) {
        console.warn(`Scan failed for ${reportedUrl}:`, scanError);
        scanResultsData = { trustScore: 0, deductions: ['Scan failed during report submission.'] };
    }

    try {
        let hanaSuccess = false;
        // --- Write to HANA FIRST ---
       try {
            const hanaSql = `
                INSERT INTO "GE210480"."PHISHER_REPORTS"
                ("REPORTED_URL", "REPORT_DETAILS", "REPORTER_ID", "REPORTER_EMAIL", "STATUS", "TRUST_SCORE", "DEDUCTIONS", "TIMESTAMP")
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            // --- CRITICAL FIX: Explicitly handle potential null/undefined values ---
            const trustScore = typeof scanResultsData?.trustScore === 'number' ? scanResultsData.trustScore : 0;
            const deductionsString = Array.isArray(scanResultsData?.deductions) ? scanResultsData.deductions.join('; ') : null;

            const hanaParams = [
                reportedUrl ?? null,
                reportDetails ?? null,
                user.uid ?? null,
                user.email ?? null,
                'pending',
                trustScore,
                deductionsString,
                new Date().toISOString()
            ];
            // --- END CRITICAL FIX ---


            console.log('[DEBUG] Inserting into SAP HANA with parameters:', hanaParams);

            await queryHana(hanaSql, hanaParams);
            console.log('[SAP HANA] Report inserted successfully.');
            hanaSuccess = true;
        } catch (hanaError) {
            console.error('[SAP HANA] Failed to insert report:', hanaError);
        }

        // --- Write to Firestore SECOND ---
        const firestoreReportData = {
            reportedUrl,
            reportDetails,
            reporterId: user.uid,
            reporterEmail: user.email,
            status: 'pending',
            scanResults: scanResultsData,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await reportsCollection.add(firestoreReportData);
        console.log(`[Firestore] Report added with ID: ${docRef.id}`);

        if (hanaSuccess) {
            res.status(201).json({ message: 'Report submitted successfully to both databases!', reportId: docRef.id });
        } else {
            res.status(201).json({ message: 'Report submitted to Firestore, but failed for SAP HANA.', reportId: docRef.id });
        }

    } catch (error) {
        console.error('[Backend] Report submission failed:', error);
        res.status(500).json({ message: 'Failed to submit report.', error });
    }
};

// Get reports by authenticated user
export const getUserReports = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || !user.uid) {
        return res.status(401).json({ message: 'Authentication required.' });
    }

    try {
        const userReportsSnapshot = await reportsCollection
            .where('reporterId', '==', user.uid)
            .orderBy('timestamp', 'desc')
            .get();

        const userReports = userReportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(userReports);
    } catch (error) {
        console.error('Error fetching user reports:', error);
        res.status(500).json({ message: 'Failed to fetch user reports.', error });
    }
};

// Get all reports (admin usage)
export const getAllReports = async (_req: Request, res: Response) => {
    try {
        const allReportsSnapshot = await reportsCollection.orderBy('timestamp', 'desc').get();
        const allReports = allReportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(allReports);
    } catch (error) {
        console.error('Error fetching all reports:', error);
        res.status(500).json({ message: 'Failed to fetch all reports.', error });
    }
};

// Get report count for a given URL
export const getReportCount = async (req: Request, res: Response) => {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: 'URL query parameter is required.' });
    }

    try {
        const snapshot = await reportsCollection.where('reportedUrl', '==', url).count().get();
        const count = snapshot.data().count;

        console.log(`[Count] ${count} reports found for URL: ${url}`);
        res.status(200).json({ url, reportCount: count });
    } catch (error) {
        console.error(`[Count] Failed to get report count for URL ${url}:`, error);
        res.status(500).json({ message: 'Failed to get report count.', error });
    }
};