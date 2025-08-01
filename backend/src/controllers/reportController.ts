// backend/src/controllers/reportController.ts
import { Request, Response } from 'express';
import { reportsCollection } from '../models/Report';
import { performScanAndCalculateScore } from './scanController'; // Import your scan logic
import * as admin from 'firebase-admin'; // For admin.firestore.FieldValue

// Extend Request type to include user property
declare global {
    namespace Express {
        interface Request {
            user?: admin.auth.DecodedIdToken;
        }
    }
}

// Middleware to verify Firebase ID Token (for authenticated reports)
export const verifyIdToken = async (req: Request, res: Response, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token required.' });
    }
    const idToken = authHeader.split(' ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken; // Attach user info to request
        next();
    } catch (error) {
        console.error('Error verifying ID token:', error);
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};


// Function to create a new report
export const createReport = async (req: Request, res: Response) => {
    const { reportedUrl, reportDetails } = req.body;
    const user = req.user;

    if (!reportedUrl) {
        return res.status(400).json({ message: 'Reported URL is required.' });
    }
    if (!user || !user.uid) {
        return res.status(401).json({ message: 'Authentication required to submit a report.' });
    }

    let scanResults: any = {};
    try {
        const scanResponse = await performScanAndCalculateScore(reportedUrl, ''); // Pass empty content for now
        scanResults = {
            trustScore: scanResponse.trustScore,
            deductions: scanResponse.deductions
        };
    } catch (scanError) {
        console.warn(`Could not get fresh scan results for reported URL ${reportedUrl} during report submission:`, scanError);
    }

    try {
        const newReportData = {
            reportedUrl,
            reportDetails,
            reporterId: user.uid,
            reporterEmail: user.email,
            status: 'pending',
            scanResults: scanResults,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await reportsCollection.add(newReportData);
        res.status(201).json({ message: 'Report submitted successfully!', reportId: docRef.id });
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ message: 'Failed to submit report.', error });
    }
};

// Function to get reports by user (for user's dashboard)
export const getUserReports = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || !user.uid) {
        return res.status(401).json({ message: 'Authentication required.' });
    }
    try {
        const userReportsSnapshot = await reportsCollection.where('reporterId', '==', user.uid).orderBy('timestamp', 'desc').get();
        const userReports = userReportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(userReports);
    } catch (error) {
        console.error('Error fetching user reports:', error);
        res.status(500).json({ message: 'Failed to fetch user reports.', error });
    }
};

// Function to get all reports (for an admin dashboard - requires more robust auth)
export const getAllReports = async (req: Request, res: Response) => {
    // This route should be protected by admin-level authentication in a real app
    try {
        const allReportsSnapshot = await reportsCollection.orderBy('timestamp', 'desc').get();
        const allReports = allReportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(allReports);
    } catch (error) {
        console.error('Error fetching all reports:', error);
        res.status(500).json({ message: 'Failed to fetch all reports.', error });
    }
};

// NEW FUNCTION: Get report count for a specific URL
export const getReportCount = async (req: Request, res: Response) => { // <--- ADD THIS FUNCTION
    const { url } = req.query; // Get URL from query parameter

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: 'URL query parameter is required.' });
    }

    try {
        // Count documents where reportedUrl matches the query URL
        const snapshot = await reportsCollection.where('reportedUrl', '==', url).count().get();
        const count = snapshot.data().count; // Get the count

        console.log(`[Backend-Report] Found ${count} reports for URL: ${url}`);
        res.status(200).json({ url: url, reportCount: count });
    } catch (error) {
        console.error(`[Backend-Report] Error getting report count for URL ${url}:`, error);
        res.status(500).json({ message: 'Failed to get report count.', error });
    }
};