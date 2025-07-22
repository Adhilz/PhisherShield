// backend/src/models/Report.ts
import { db } from '../firebaseAdmin'; // Import Firestore instance
import * as admin from 'firebase-admin'; // For admin.firestore.FieldValue

export interface IReport {
    id?: string; // Firestore document ID
    reportedUrl: string;
    reportDetails?: string;
    reporterId: string; // Firebase Auth UID of the reporter
    reporterEmail?: string; // Email of the reporter (from auth token)
    status: 'pending' | 'reviewed' | 'phishing' | 'safe';
    scanResults?: { // Store a snapshot of scan results at time of report
        trustScore: number;
        deductions: string[];
        // Potentially add more detailed scan data
    };
    timestamp: admin.firestore.FieldValue; // Use Firestore server timestamp
}

// Firestore collection reference
export const reportsCollection = db.collection('reports');
