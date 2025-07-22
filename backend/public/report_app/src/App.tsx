// phishing-detection/backend/public/report_app/src/App.tsx
import React, { useState } from 'react';
import { useFirebase } from './AuthContext';
import AuthForm from './AuthForm';
import ReportPage from './ReportPage';

const App: React.FC = () => {
    const { currentUser, loading: firebaseLoading } = useFirebase();
    const [showLogin, setShowLogin] = useState(true); // State to toggle between login/signup

    if (firebaseLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-gray-700 text-lg">Loading authentication...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-blue-700 mb-3">PhisherShield</h1>
                <p className="text-lg text-gray-600 max-w-xl">
                    Your proactive browser extension to detect phishing and scam websites.
                    Report suspicious links to help protect the community!
                </p>
            </div>

            {currentUser ? (
                // If logged in, show the report page
                <ReportPage />
            ) : (
                // If not logged in, show login/signup form
                <div className="flex flex-col items-center">
                    {showLogin ? (
                        <AuthForm type="login" onSuccess={() => console.log('Login successful!')} />
                    ) : (
                        <AuthForm type="signup" onSuccess={() => console.log('Sign up successful!')} />
                    )}
                    <button
                        onClick={() => setShowLogin(!showLogin)}
                        className="mt-4 text-blue-600 hover:underline"
                    >
                        {showLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default App;