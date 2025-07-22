// phishing-detection/backend/public/report_app/src/ReportPage.tsx
import React, { useState, useEffect } from 'react';
import { useFirebase } from './AuthContext';

const ReportPage: React.FC = () => {
    const { currentUser, getIdToken, logout } = useFirebase();
    const [reportedUrl, setReportedUrl] = useState('');
    const [reportDetails, setReportDetails] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Pre-fill URL if coming from extension via query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const initialUrl = urlParams.get('url');
        if (initialUrl) {
            setReportedUrl(initialUrl);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        setLoading(true);

        if (!currentUser) {
            setError('You must be logged in to report.');
            setLoading(false);
            return;
        }

        try {
            const idToken = await getIdToken();
            if (!idToken) throw new Error('Failed to get authentication token.');

            const response = await fetch('http://localhost:4000/api/report', { // Backend Report API Endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}` // Send ID token for authentication
                },
                body: JSON.stringify({ reportedUrl, reportDetails })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setReportDetails(''); // Clear details after successful submission
                // reportedUrl can remain if user wants to submit more reports for it
            } else {
                setError(`Error: ${data.message || 'Something went wrong.'}`);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Report Suspicious Link</h2>
            {currentUser && (
                <p className="text-gray-600 text-center mb-4">
                    Logged in as: <span className="font-semibold">{currentUser.email}</span>
                    <button onClick={logout} className="ml-4 text-blue-600 hover:underline">Logout</button>
                </p>
            )}
            {message && <p className="text-green-600 text-center mb-4">{message}</p>}
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="reportedUrl" className="block text-gray-700 text-sm font-bold mb-2">
                        Suspicious URL:
                    </label>
                    <input
                        type="url"
                        id="reportedUrl"
                        value={reportedUrl}
                        onChange={(e) => setReportedUrl(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="reportDetails" className="block text-gray-700 text-sm font-bold mb-2">
                        Details (optional):
                    </label>
                    <textarea
                        id="reportDetails"
                        value={reportDetails}
                        onChange={(e) => setReportDetails(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32 resize-y"
                        placeholder="e.g., This page asks for my password and looks fake."
                    />
                </div>
                <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transition duration-150 ease-in-out"
                    disabled={loading}
                >
                    {loading ? 'Submitting...' : 'Submit Report'}
                </button>
            </form>
        </div>
    );
};

export default ReportPage;