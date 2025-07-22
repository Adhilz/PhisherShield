// extension/src/pages/AlertPage.tsx
// Note: This component is now designed to be injected by the content script,
// not rendered by alert.html.
import React, { useEffect, useState } from 'react';
// No need for ReactDOMClient.createRoot here, as it's done in content.ts
import AlertBanner from '../components/AlertBanner';
import TrustScoreDisplay from '../components/TrustScoreDisplay';

interface AlertData {
    url: string;
    score: number;
    message: string;
    tabId: number; // This will be needed to send messages back to background
}

const AlertPage: React.FC = () => {
    const [alertData, setAlertData] = useState<AlertData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Retrieve stored data from background script when component mounts
        chrome.storage.local.get('phisherShieldAlertData', (data) => {
            if (data.phisherShieldAlertData) {
                setAlertData(data.phisherShieldAlertData);
                setLoading(false);
                console.log("[AlertPage] Successfully retrieved data for overlay:", data.phisherShieldAlertData);

                // We are keeping the remove commented out for now for debugging
                // (chrome.storage.local.remove('phisherShieldAlertData');)
            } else {
                console.error("[AlertPage] NO DATA FOUND IN STORAGE for overlay!");
                setLoading(false);
                setAlertData({ url: 'unknown', score: 0, message: 'Error: Could not retrieve site information for alert overlay.', tabId: -1 });
            }
        });
    }, []); // Runs once when component mounts

    // Helper function to send user actions back to the background script
    const sendUserAction = (action: 'continue' | 'report' | 'block') => {
        if (alertData) {
            chrome.runtime.sendMessage({
                type: 'userAction',
                action: action,
                originalUrl: alertData.url,
                tabId: alertData.tabId // Pass tabId for background script to use
            });
        }
    };

    // Handlers for the buttons
    const handleContinue = () => {
        sendUserAction('continue');
        // Content script will handle removing the overlay
    };

    const handleReport = () => {
        sendUserAction('report');
        chrome.tabs.create({ url: `http://localhost:4000/report?url=${encodeURIComponent(alertData ? alertData.url : 'unknown')}` });
        // Content script will handle removing the overlay
    };

    const handleBlock = () => {
        sendUserAction('block');
        // Content script will handle removing the overlay
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif', color: 'white' }}>
                <p>Loading PhisherShield check...</p>
            </div>
        );
    }

    if (!alertData || alertData.url === 'unknown') {
        return (
            <div className="phishershield-alert-box" style={{ backgroundColor: 'white' }}> {/* Apply base class and override background */}
                <h1 className="warning">Error</h1>
                <p>Could not retrieve site information for alert overlay.</p>
                <p>Please check your background service worker console for details.</p>
            </div>
        );
    }

    const { url, score, message } = alertData;
    const isSuspicious = score < 50;

    return (
        <div className={isSuspicious ? 'phishershield-alert-box suspicious' : 'phishershield-alert-box safe'}>
            <h1 className={isSuspicious ? 'warning' : 'safe'}>
                {isSuspicious ? '⚠ Warning: Suspicious Site Detected!' : '✅ Site Appears Safe'}
            </h1>
            <p style={{ fontSize: '0.95em', color: '#555', marginBottom: '10px' }}>
                <strong>URL:</strong> <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', wordBreak: 'break-all' }}>{url}</a>
            </p>
            {/* TrustScoreDisplay and AlertBanner components are rendered here */}
            <TrustScoreDisplay trustScore={score} />
            <AlertBanner message={message} />

            <div className="phishershield-buttons-container">
                {isSuspicious && ( // Show Report and Block options only if suspicious
                    <>
                        <button
                            onClick={handleReport}
                            className="report-btn"
                        >
                            Report
                        </button>
                        <button
                            onClick={handleBlock}
                            className="block-btn"
                        >
                            Block
                        </button>
                    </>
                )}
                <button
                    onClick={handleContinue}
                    className="continue-btn"
                >
                    Continue to Site
                </button>
            </div>
        </div>
    );
};

export default AlertPage;