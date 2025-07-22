// backend/src/firebaseAdmin.ts
import * as admin from 'firebase-admin';

// --- IMPORTANT: Service Account Key Setup ---
// 1. Go to Firebase Console -> Project settings (gear icon) -> Service accounts.
// 2. Click "Generate new private key". This will download a JSON file.
// 3. Place this JSON file in your 'backend' directory (e.g., 'serviceAccountKey.json').
//    *** DO NOT COMMIT THIS FILE TO GIT *** (Add 'serviceAccountKey.json' to your .gitignore)
// 4. Update the path in `require()` below if your file name is different.

// OR, if running in a Canvas-like environment where __firebase_config is available
// and you don't have a service account file directly accessible,
// you might need to mock or adjust this for local development.
// For this example, we'll assume a local serviceAccountKey.json for backend.

try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(require('../serviceAccountKey.json')) // Adjust path to your downloaded key
        });
        console.log('[Firebase Admin] Firebase Admin SDK initialized.');
    }
} catch (error) {
    console.error('[Firebase Admin] Error initializing Firebase Admin SDK:', error);
    // This error often means the service account key file is missing or invalid.
}

export const db = admin.firestore();
export const auth = admin.auth(); // Export auth for server-side ID token verification
