// extension/src/pages/Popup.tsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import TrustScoreBox from '../components/TrustScoreBox';  // Imports TrustScoreDisplay component
import AlertBanner from '../components/AlertBanner';       // Imports AlertBanner component
import ReportPhishingForm from '../components/ReportPhishingForm'; // Imports ReportPhishingForm component
import popupStyles from './../styles/popup.css';// Imports the CSS for the popup

// Define cache duration (must match background.ts)
const SCAN_CACHE_DURATION_MS = 5 * 60 * 1000; // Cache results for 5 minutes (5 * 60 seconds * 1000 ms)

function injectPopupCss(cssString: string) {
    const styleTag = document.createElement('style');
    styleTag.textContent = cssString;
    // Append to document.head for popup specific styles
    document.head.appendChild(styleTag);
    console.log('[Popup] Injected popup.css dynamically.');
}

// Call this immediately when Popup.tsx loads
injectPopupCss(popupStyles); // <--- CALL TO INJECT CSS


const Popup: React.FC = () => {
    // State variables to hold scan results and UI status
   const [trustScore, setTrustScore] = useState<number | null>(null);
    const [url, setUrl] = useState<string>('');
    const [alertMessage, setAlertMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [geminiAiScore, setGeminiAiScore] = useState<number | null>(null);
    const [geminiAiReason, setGeminiAiReason] = useState<string | null>(null); // <--- NEW STATE
    const [deductions, setDeductions] = useState<string[]>([]); // State for detailed deductions
    const [reportCount, setReportCount] = useState<number>(0);
    // useEffect hook runs once when the component mounts
    useEffect(() => {
        console.log('[Popup] Popup component mounted. Initiating scan or cache check.');
        // Query the active tab to get its ID and URL
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id && tabs[0].url) { // Ensure tabId and url are available
                const activeTabId = tabs[0].id;
                const activeTabUrl = tabs[0].url;
                setUrl(activeTabUrl);

                // Check cache first before performing a full scan
                chrome.storage.local.get('scanCache', (result) => {
                    const scanCache = result.scanCache || {};
                    const cachedEntry = scanCache[activeTabUrl];

                    // If a fresh cached entry exists, use it
                    if (cachedEntry && (Date.now() - cachedEntry.timestamp < SCAN_CACHE_DURATION_MS)) {
                        console.log(`[Popup] Using cached scan result for ${activeTabUrl}.`);
                        setTrustScore(cachedEntry.score);
                        setAlertMessage(cachedEntry.message);
                        setGeminiAiScore(cachedEntry.geminiAiScore); 
                        setGeminiAiReason(cachedEntry.geminiAiReason);// Set AI score from cache
                        setDeductions(cachedEntry.deductions || []); // Set deductions from cache
                        setIsLoading(false);
                        setError(null);
                    } else {
                        // If no fresh cache, proceed with a full scan
                        console.log(`[Popup] No fresh cache for ${activeTabUrl}, performing full scan.`);
                        
                        // Request page content from content script if it's a web page (http/https)
                        if (activeTabUrl.startsWith('http://') || activeTabUrl.startsWith('https://')) {
                            // Send message to the content script to extract page content
                            chrome.tabs.sendMessage(activeTabId, { type: 'extractPageContent' }, (response) => {
                                // Check for chrome.runtime.lastError, which indicates if the message failed (e.g., content script not injected)
                                if (chrome.runtime.lastError) {
                                    console.warn("[Popup] Could not send message to content script (e.g., on chrome:// or error pages):", chrome.runtime.lastError.message);
                                    // Proceed with scan without page content if message fails
                                    fetchAndSetScanResult(activeTabUrl, '');
                                } else {
                                    const pageContent = response ? response.content : '';
                                    fetchAndSetScanResult(activeTabUrl, pageContent); // Pass extracted content to the scan function
                                }
                            });
                        } else {
                            // For non-web pages (like chrome://, about:blank, file:///), scan only the URL
                            console.log(`[Popup] Scanning non-web URL: ${activeTabUrl}`);
                            fetchAndSetScanResult(activeTabUrl, '');
                        }
                    }
                });
            } else {
                // Handle cases where current tab URL or ID cannot be obtained
                setError('Could not get current tab URL or Tab ID. Please ensure you are on a valid webpage.');
                setIsLoading(false);
            }
        });
        // Cleanup function for useEffect (logs when component unmounts)
        return () => { console.log('[Popup] Popup component unmounted.'); };
    }, []); // Empty dependency array ensures this effect runs only once on mount

    /**
     * Fetches scan results from the backend and updates the component's state and cache.
     * @param targetUrl The URL to be scanned.
     * @param content The extracted page content (optional).
     */
    const fetchAndSetScanResult = async (targetUrl: string, content: string) => {
        setIsLoading(true); // Set loading state to true
        setError(null); // Clear any previous errors
        try {
            // Make a POST request to your backend's trust score API
            const response = await fetch(`http://localhost:4000/api/trustScore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: targetUrl, content: content }), // Send both URL and content
            });

            // Handle non-OK HTTP responses
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
            }

            const data = await response.json(); // Parse the JSON response
            // Update component state with fetched data
            setTrustScore(data.trustScore);
            setAlertMessage(data.alertMessage);
            setGeminiAiScore(data.geminiAiScore);
            setGeminiAiReason(data.geminiAiReason); // Set AI score from response
            setDeductions(data.deductions || []);
            setReportCount(data.reportCount || 0);// Set deductions from response

            // Update cache after a successful scan from the popup
            chrome.storage.local.get('scanCache', async (result) => {
                const scanCache = result.scanCache || {};
                scanCache[targetUrl] = {
                    url: targetUrl,
                    score: data.trustScore,
                    message: data.alertMessage,
                    geminiAiScore: data.geminiAiScore, // Cache AI score
                    setGeminiAiReason: data.geminiAiReason,
                    deductions: data.deductions || [],
                    reportCount: data.reportCount || 0, // Cache deductions
                    timestamp: Date.now() // Update timestamp for freshness
                };
                await chrome.storage.local.set({ scanCache: scanCache });
                console.log(`[Popup] Updated cache for ${targetUrl} after full scan.`);
            });

        } catch (err) {
            // Handle any errors during the fetch operation
            console.error('Error fetching trust score:', err);
            setError(`You're Offline or server is down. Please check your connection or try again later.`);
            setTrustScore(0); // Default to a low score on error
            setAlertMessage('Could not determine safety. Network error or API issue.');
        } finally {
            setIsLoading(false); // Always set loading to false after fetch attempt
        }
    };

    // Conditional rendering based on loading and error states
   
if (isLoading) {
    return (
        <div className="phishershield-popup-container" style={{ justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
            <img
                // CHANGE THIS LINE to use the filename of your new image
                src="icons/loading.png" // <--- EXAMPLE
                alt="PhisherShield is scanning..."
                className="phishershield-logo-spinner"
            />
            <p className="phishershield-status-message">Scanning in progress...</p>
            <p className="phishershield-status-message" style={{ fontSize: '0.9em' }}>{url || 'current tab'}</p>
        </div>
    );
}

    if (error) {
        return (
            <div className="phishershield-popup-container">
                <h2 className="phishershield-status-message error">Error</h2>
                <p className="phishershield-status-message">{error}</p>
                <p className="phishershield-status-message">Please ensure your backend server is running and accessible.</p>
            </div>
        );
    }

    // Main render for the popup content
    return (
        <div className="phishershield-popup-container">
            <h1>PhisherShield Results </h1>
            {/* TrustScoreDisplay component (clickable to show deductions) */}
            <TrustScoreBox score={trustScore} deductions={deductions} />

            {/* Display Gemini AI Score separately if available */}
            {geminiAiScore !== null && (
                <div style={{ marginTop: '10px', padding: '8px', borderRadius: '5px', backgroundColor: '#e0f2f7', border: '1px solid #00bcd4', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9em', color: '#006064' }}>AI Score: <strong>{geminiAiScore}</strong></p>
                     {geminiAiReason && <p style={{ fontSize: '0.8em', color: '#006064', marginTop: '5px' }}>{geminiAiReason}</p>}
                </div>
            )}
              {reportCount > 0 && ( // <--- NEW: Display report count if > 0
                <div style={{ marginTop: '10px', padding: '8px', borderRadius: '5px', backgroundColor: '#fffbe6', border: '1px solid #ffcc00', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9em', color: '#856404' }}>
                        Reported by <strong>{reportCount}</strong> users via PhisherShield.
                    </p>
                </div>
            )}

            {/* AlertBanner component */}
            <AlertBanner message={alertMessage} />

            {/* ReportPhishingForm component */}
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