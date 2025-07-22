// phishing-detection/backend/public/report_app/src/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, Auth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

interface FirebaseContextType {
    app: FirebaseApp | null;
    auth: Auth | null;
    db: Firestore | null;
    currentUser: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    getIdToken: () => Promise<string | null>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error('useFirebase must be used within a FirebaseProvider');
    }
    return context;
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [app, setApp] = useState<FirebaseApp | null>(null);
    const [auth, setAuth] = useState<Auth | null>(null);
    const [db, setDb] = useState<Firestore | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // These global variables are provided by the Canvas environment
        // They will be undefined when running React app locally/outside Canvas.
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

        // --- IMPORTANT: Replace this entire localFirebaseConfig object with your actual generated config ---
        // You got this from Firebase Console -> Project settings -> Your apps -> Web app
       const localfirebaseConfig = {
  apiKey: "AIzaSyA-VFGXvKFPXkOHuVeZWbOOcHNoM0xfcgk",
  authDomain: "phishershield-reports.firebaseapp.com",
  projectId: "phishershield-reports",
  storageBucket: "phishershield-reports.firebasestorage.app",
  messagingSenderId: "995616434068",
  appId: "1:995616434068:web:5524093d236a5b9e781181"
};

        // Use local config if Canvas globals are not available
        const finalFirebaseConfig = firebaseConfig || localfirebaseConfig;
        // --- END IMPORTANT ---


        if (finalFirebaseConfig.apiKey && finalFirebaseConfig.projectId) { // Check if config is valid
            const firebaseApp = initializeApp(finalFirebaseConfig);
            const firebaseAuth = getAuth(firebaseApp);
            const firestoreDb = getFirestore(firebaseApp);

            setApp(firebaseApp);
            setAuth(firebaseAuth);
            setDb(firestoreDb);

            const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
                if (user) {
                    setCurrentUser(user);
                    console.log(`[Auth] User logged in: ${user.email}`);
                } else {
                    setCurrentUser(null);
                    console.log('[Auth] User logged out.');
                }
                setLoading(false);
            });

            // Attempt initial sign-in with custom token if provided by Canvas
            if (initialAuthToken && firebaseAuth) { // Ensure auth is not null
                signInWithCustomToken(firebaseAuth, initialAuthToken)
                    .then(() => console.log('[Auth] Signed in with custom token.'))
                    .catch(error => {
                        console.error('[Auth] Custom token sign-in failed:', error);
                        // Fallback to anonymous sign-in if custom token fails or is not provided
                        if (firebaseAuth) { // Ensure auth is not null
                            signInAnonymously(firebaseAuth)
                                .then(() => console.log('[Auth] Signed in anonymously.'))
                                .catch(err => console.error('[Auth] Anonymous sign-in failed:', err));
                        }
                    });
            } else if (firebaseAuth) { // If no custom token, sign in anonymously
                signInAnonymously(firebaseAuth)
                    .then(() => console.log('[Auth] Signed in anonymously.'))
                    .catch(err => console.error('[Auth] Anonymous sign-in failed:', err));
            } else {
                console.error('Firebase Auth not initialized for anonymous sign-in.');
            }


            return () => unsubscribe(); // Cleanup auth listener
        } else {
            console.error('Firebase config not found or invalid. Please provide your Firebase config.');
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        if (!auth) throw new Error('Auth not initialized.');
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signup = async (email: string, password: string) => {
        if (!auth) throw new Error('Auth not initialized.');
        await createUserWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        if (!auth) throw new Error('Auth not initialized.');
        await auth.signOut();
    };

    const getIdToken = async () => {
        if (currentUser) {
            return await currentUser.getIdToken();
        }
        return null;
    };

    const value = { app, auth, db, currentUser, loading, login, signup, logout, getIdToken };

    return (
        <FirebaseContext.Provider value={value}>
            {children}
        </FirebaseContext.Provider>
    );
};