// extension/src/pages/Popup.tsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';
import TrustScoreBox from '../components/TrustScoreBox';
import AlertBanner from '../components/AlertBanner';
import ReportPhishingForm from '../components/ReportPhishingForm';
import popupStyles from './../styles/popup.css';

// Define cache duration (must match background.ts)
const SCAN_CACHE_DURATION_MS = 5 * 60 * 1000; // Cache results for 5 minutes (5 * 60 seconds * 1000 ms)

function injectPopupCss(cssString: string) {
    const styleTag = document.createElement('style');
    styleTag.textContent = cssString;
    document.head.appendChild(styleTag);
    console.log('[Popup] Injected popup.css dynamically.');
}

// Call this immediately when Popup.tsx loads
injectPopupCss(popupStyles);

const Popup: React.FC = () => {
    // State variables to hold scan results and UI status
    const [trustScore, setTrustScore] = useState<number | null>(null);
    const [url, setUrl] = useState<string>('');
    const [alertMessage, setAlertMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [geminiAiScore, setGeminiAiScore] = useState<number | null>(null);
    const [geminiAiReason, setGeminiAiReason] = useState<string | null>(null);
    const [deductions, setDeductions] = useState<string[]>([]);
    const [reportCount, setReportCount] = useState<number>(0);

    // useEffect hook runs once when the component mounts
    useEffect(() => {
        console.log('[Popup] Popup component mounted. Initiating scan or cache check.');
        // Query the active tab to get its ID and URL
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id && tabs[0].url) {
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
                        setGeminiAiReason(cachedEntry.geminiAiReason);
                        setDeductions(cachedEntry.deductions || []);
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
                                    fetchAndSetScanResult(activeTabUrl, pageContent);
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
    }, []);

    /**
     * Fetches scan results from the backend and updates the component's state and cache.
     * @param targetUrl The URL to be scanned.
     * @param content The extracted page content (optional).
     */
    const fetchAndSetScanResult = async (targetUrl: string, content: string) => {
        setIsLoading(true);
        setError(null);
        try {
            // Make a POST request to your backend's trust score API
            const response = await fetch(`http://localhost:4000/api/trustScore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: targetUrl, content: content }),
            });

            // Handle non-OK HTTP responses
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            // Update component state with fetched data
            setTrustScore(data.trustScore);
            setAlertMessage(data.alertMessage);
            setGeminiAiScore(data.geminiAiScore);
            setGeminiAiReason(data.geminiAiReason);
            setDeductions(data.deductions || []);
            setReportCount(data.reportCount || 0);

            // Update cache after a successful scan from the popup
            chrome.storage.local.get('scanCache', async (result) => {
                const scanCache = result.scanCache || {};
                scanCache[targetUrl] = {
                    url: targetUrl,
                    score: data.trustScore,
                    message: data.alertMessage,
                    geminiAiScore: data.geminiAiScore,
                    geminiAiReason: data.geminiAiReason,
                    deductions: data.deductions || [],
                    reportCount: data.reportCount || 0,
                    timestamp: Date.now()
                };
                await chrome.storage.local.set({ scanCache: scanCache });
                console.log(`[Popup] Updated cache for ${targetUrl} after full scan.`);
            });

        } catch (err) {
            // Handle any errors during the fetch operation
            console.error('Error fetching trust score:', err);
            setError(`You're Offline or server is down. Please check your connection or try again later.`);
            setTrustScore(0);
            setAlertMessage('Could not determine safety. Network error or API issue.');
        } finally {
            setIsLoading(false);
        }
    };

    // Loading State
    if (isLoading) {
        return (
            <motion.div 
                className="phishershield-popup-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
            >
                <motion.div 
                    className="phishershield-loading-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <img 
                        src="icons/loading.png" 
                        alt="PhisherShield is scanning..."
                        className="phishershield-logo-spinner"
                    />
                    <motion.p 
                        className="phishershield-status-message"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        Scanning in progress...
                    </motion.p>
                    <motion.p 
                        className="phishershield-status-message"
                        style={{ fontSize: '0.9em' }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        {url || 'current tab'}
                    </motion.p>
                </motion.div>
            </motion.div>
        );
    }

    // Error State
    if (error) {
        return (
            <motion.div 
                className="phishershield-popup-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{ textAlign: 'center' }}
                >
                    <AlertCircle size={48} color="#ea4335" style={{ marginBottom: '16px' }} />
                    <h2 className="phishershield-status-message error">Error</h2>
                    <p className="phishershield-status-message">{error}</p>
                    <p className="phishershield-status-message">Please ensure your backend server is running and accessible.</p>
                </motion.div>
            </motion.div>
        );
    }

    // Main render for the popup content
    return (
        <motion.div 
            className="phishershield-popup-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Shield size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                PhisherShield Results
            </motion.h1>

            {/* TrustScoreBox component */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <TrustScoreBox score={trustScore} deductions={deductions} />
            </motion.div>

            {/* Display Gemini AI Score separately if available */}
            <AnimatePresence>
                {geminiAiScore !== null && (
                    <motion.div 
                        className="phishershield-ai-score"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: 0.4 }}
                    >
                        <p className="phishershield-ai-score-label">AI Analysis Score</p>
                        <span className="phishershield-ai-score-value">{geminiAiScore}</span>
                        {geminiAiReason && (
                            <p className="phishershield-ai-reason">{geminiAiReason}</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Display report count if > 0 */}
            <AnimatePresence>
                {reportCount > 0 && (
                    <motion.div 
                        className="phishershield-report-count"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: 0.5 }}
                    >
                        <p className="phishershield-report-count-text">
                            Reported by <span className="phishershield-report-count-number">{reportCount}</span> users via PhisherShield.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AlertBanner component */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <AlertBanner message={alertMessage} />
            </motion.div>

            {/* ReportPhishingForm component */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
            >
                {url && <ReportPhishingForm url={url} />}
            </motion.div>
        </motion.div>
    );
};

// Mount the React app to the root div in popup.html
const rootElement = document.getElementById('popup-root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(<Popup />);
}

export default Popup;