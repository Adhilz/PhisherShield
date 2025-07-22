// backend/src/controllers/reportController.ts
import { Request, Response } from 'express';
import { reportsCollection } from '../models/Report';
import { getTrustScore as getScanResults } from './scanController'; // Import your scan logic
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
    const user = req.user; // User info from verifyIdToken middleware

    if (!reportedUrl) {
        return res.status(400).json({ message: 'Reported URL is required.' });
    }
    if (!user || !user.uid) {
        return res.status(401).json({ message: 'Authentication required to submit a report.' });
    }

    let scanResults: any = {};
    try {
        // Refactor getTrustScore in scanController.ts to return {score, deductions}
        // instead of sending a response directly. This allows internal calls.
        // For now, we'll call it with mock req/res, which will send a response
        // and is not ideal for internal use, but avoids immediate refactor.
        const mockReq = { body: { url: reportedUrl, content: '' } } as Request; // Mock request body
        const mockRes = {
            json: (data: any) => {
                scanResults = {
                    trustScore: data.trustScore,
                    deductions: data.alertMessage // Adjust if you want actual deductions array
                };
                return mockRes; // Return mockRes to chain
            },
            status: (code: number) => mockRes // Mock status method
        } as Response;

        // Call the getTrustScore function. It will send a response, but we capture the data via mockRes.json
        await getScanResults(mockReq, mockRes);

    } catch (scanError) {
        console.warn(`Could not get fresh scan results for reported URL ${reportedUrl}:`, scanError);
        // Continue without fresh scan results if it fails
    }

    try {
        const newReportData = {
            reportedUrl,
            reportDetails,
            reporterId: user.uid,
            reporterEmail: user.email,
            status: 'pending',
            scanResults: scanResults,
            timestamp: admin.firestore.FieldValue.serverTimestamp() // Use Firestore server timestamp
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
