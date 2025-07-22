// extension/src/pages/Popup.tsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import TrustScoreDisplay from '../components/TrustScoreDisplay';
import AlertBanner from '../components/AlertBanner';
import ReportPhishingForm from '../components/ReportPhishingForm';

// Define cache duration (must match background.ts)
const SCAN_CACHE_DURATION_MS = 5 * 60 * 1000; // Cache results for 5 minutes (5 * 60 seconds * 1000 ms)

const Popup: React.FC = () => {
    const [trustScore, setTrustScore] = useState<number | null>(null);
    const [url, setUrl] = useState<string>('');
    const [alertMessage, setAlertMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('[Popup] Popup component mounted. Initiating scan or cache check.');
        // Query the active tab to get its ID and URL
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id && tabs[0].url) {
                const activeTabId = tabs[0].id;
                const activeTabUrl = tabs[0].url;
                setUrl(activeTabUrl);

                // Check cache first before fetching
                chrome.storage.local.get('scanCache', (result) => {
                    const scanCache = result.scanCache || {};
                    const cachedEntry = scanCache[activeTabUrl];

                    if (cachedEntry && (Date.now() - cachedEntry.timestamp < SCAN_CACHE_DURATION_MS)) {
                        // Use cached data if fresh
                        console.log(`[Popup] Using cached scan result for ${activeTabUrl}.`);
                        setTrustScore(cachedEntry.score);
                        setAlertMessage(cachedEntry.message);
                        setIsLoading(false);
                        setError(null);
                    } else {
                        // If no cache or stale cache, proceed with full scan
                        console.log(`[Popup] No fresh cache for ${activeTabUrl}, performing full scan.`);
                        
                        // Request page content from content script if it's a web page
                        if (activeTabUrl.startsWith('http://') || activeTabUrl.startsWith('https://')) {
                            chrome.tabs.sendMessage(activeTabId, { type: 'extractPageContent' }, (response) => {
                                // Check for runtime.lastError if content script isn't injected (e.g., on chrome:// pages, or after an error)
                                if (chrome.runtime.lastError) {
                                    console.warn("[Popup] Could not send message to content script (e.g., on chrome:// or error pages):", chrome.runtime.lastError.message);
                                    // Proceed without content if message fails (e.g., content script not injected)
                                    fetchAndSetScanResult(activeTabUrl, '');
                                } else {
                                    const pageContent = response ? response.content : '';
                                    fetchAndSetScanResult(activeTabUrl, pageContent); // Pass content to fetch
                                }
                            });
                        } else {
                            // For non-web pages (chrome://, about:blank, file:///), just scan the URL without content
                            console.log(`[Popup] Scanning non-web URL: ${activeTabUrl}`);
                            fetchAndSetScanResult(activeTabUrl, '');
                        }
                    }
                });
            } else {
                setError('Could not get current tab URL or Tab ID. Please ensure you are on a valid webpage.');
                setIsLoading(false);
            }
        });
        // Cleanup function for useEffect (optional, but good practice for event listeners if any)
        return () => { console.log('[Popup] Popup component unmounted.'); };
    }, []); // Empty dependency array means this runs once on mount

    // Renamed fetchTrustScore to fetchAndSetScanResult for clarity, it now always hits backend
    const fetchAndSetScanResult = async (targetUrl: string, content: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:4000/api/trustScore`, { // Endpoint for backend scan
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: targetUrl, content: content }), // Send both URL and content
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            setTrustScore(data.trustScore);
            setAlertMessage(data.alertMessage);

            // Update cache after successful scan from popup
            chrome.storage.local.get('scanCache', async (result) => {
                const scanCache = result.scanCache || {};
                scanCache[targetUrl] = {
                    url: targetUrl,
                    score: data.trustScore,
                    message: data.alertMessage,
                    timestamp: Date.now() // Update timestamp for freshness
                };
                await chrome.storage.local.set({ scanCache: scanCache });
                console.log(`[Popup] Updated cache for ${targetUrl} after full scan.`);
            });

        } catch (err) {
            console.error('Error fetching trust score:', err);
            setError(`Failed to scan URL. Error: ${err instanceof Error ? err.message : String(err)}`);
            setTrustScore(0); // Default to low score on error
            setAlertMessage('Could not determine safety. Network error or API issue.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div style={{ padding: '20px', width: '300px', textAlign: 'center' }}>
                <p>Loading PhisherShield...</p>
                <p>Scanning: {url || 'current tab'}</p>
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
            <TrustScoreDisplay trustScore={trustScore} />
            <AlertBanner message={alertMessage} />
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