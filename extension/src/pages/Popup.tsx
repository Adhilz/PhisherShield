// extension/src/pages/Popup.tsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client'; // Make sure ReactDOM is imported
import TrustScoreDisplay from '../components/TrustScoreDisplay';
import AlertBanner from '../components/AlertBanner';
import ReportPhishingForm from '../components/ReportPhishingForm';

const Popup: React.FC = () => {
    const [trustScore, setTrustScore] = useState<number | null>(null);
    const [url, setUrl] = useState<string>('');
    const [alertMessage, setAlertMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true); // Added loading state
    const [error, setError] = useState<string | null>(null);   // Added error state

    useEffect(() => {
        // CORRECTED: Request the active tab's URL from the background script
        // This requires "tabs" permission in manifest.json
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url) {
                const activeTabUrl = tabs[0].url;
                setUrl(activeTabUrl);
                fetchTrustScore(activeTabUrl); // Pass the correct URL to fetchTrustScore
            } else {
                setError('Could not get current tab URL. Make sure the extension has permissions.');
                setIsLoading(false);
            }
        });
    }, []); // Empty dependency array means this runs once on mount

    const fetchTrustScore = async (targetUrl: string) => { // Renamed parameter to 'targetUrl' for clarity, but 'url' would also work if used consistently
        setIsLoading(true);
        setError(null); // Clear previous errors
        try {
            // CORRECTED: Using port 4000 and the /api/trustScore endpoint as confirmed
            const response = await fetch(`http://localhost:4000/api/trustScore`, {
                method: 'POST', // Assuming your /api/trustScore endpoint expects a POST request with a body
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: targetUrl }), // Send the URL in the request body
            });

            if (!response.ok) { // Handle HTTP errors (e.g., 404, 500)
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
            }

            const data = await response.json(); // Process the JSON response
            setTrustScore(data.trustScore);
            // Simple alert message based on score for demonstration
            setAlertMessage(data.trustScore >= 50 ? 'This site appears to be safe.' : 'This site might be suspicious!');
        } catch (err) {
            console.error('Error fetching trust score:', err);
            setError(`Failed to scan URL. Error: ${err instanceof Error ? err.message : String(err)}`);
            setTrustScore(null); // Reset score on error
            setAlertMessage('Could not determine safety. Network error or API issue.');
        } finally {
            setIsLoading(false); // Always set loading to false after fetch attempt
        }
    };

    // Conditional rendering based on loading/error states
    if (isLoading) {
        return (
            <div style={{ padding: '20px', width: '300px', textAlign: 'center' }}>
                <p>Loading PhisherShield...</p>
                <p>Scanning: {url || 'current tab'}</p> {/* Show URL if available */}
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '20px', width: '300px', textAlign: 'center', color: 'red' }}>
                <h2>Error</h2>
                <p>{error}</p>
                <p>Please ensure your backend server is running and accessible.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', width: '300px' }}>
            <h1>PhisherShield - Scan Results</h1>
            <TrustScoreDisplay trustScore={trustScore} /> {/* trustScore is number | null, so it matches the prop type */}
            <AlertBanner message={alertMessage} /> {/* message is string, so it matches */}
            {/* Render ReportPhishingForm only if URL is available */}
            {url && <ReportPhishingForm url={url} />}
        </div>
    );
};

// Mount the React app to the root div in popup.html
const rootElement = document.getElementById('popup-root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<Popup />);
}

export default Popup;