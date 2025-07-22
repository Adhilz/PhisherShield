// extension/src/background.ts
console.log('PhisherShield background service worker started (Corrected Message Listeners).');

// Define a flag to indicate if we are navigating after a 'continue' action
const bypassingTabs = new Set<number>();

// Define cache duration (e.g., 5 minutes)
const SCAN_CACHE_DURATION_MS = 5 * 60 * 1000; // Cache results for 5 minutes (5 * 60 seconds * 1000 ms)

// Helper function to fetch trust score from your backend
async function fetchTrustScoreFromBackend(url: string): Promise<{ trustScore: number; alertMessage: string; }> {
    try {
        console.log(`[Background] Attempting to fetch trust score for: ${url}`);
        const response = await fetch(`http://localhost:4000/api/trustScore`, { // Ensure this URL matches your backend
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, content: '' }), // Send empty content for pre-load scan
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Background] Backend HTTP error for ${url}: Status ${response.status}, Message: ${errorText}`);
            return { trustScore: 0, alertMessage: `Failed to scan site: Server error.` };
        }

        const data = await response.json();
        console.log(`[Background] Successfully fetched score for ${url}:`, data);
        return { trustScore: data.trustScore, alertMessage: data.alertMessage };
    } catch (error) {
        console.error(`[Background] Network error fetching trust score for ${url}:`, error);
        return { trustScore: 0, alertMessage: `Failed to scan site: Network error.` };
    }
}

/**
 * Attempts to send a message to a tab, retrying if 'Receiving end does not exist' error occurs.
 * @param tabId The ID of the target tab.
 * @param message The message object to send.
 * @param retries Remaining retry attempts.
 * @param delayMs Delay in milliseconds before next retry.
 */
async function retrySendMessage(tabId: number, message: any, retries: number = 3, delayMs: number = 200) {
    console.log(`[Background] Attempting to send message to tab ${tabId} (Type: ${message.type}, Retries left: ${retries})`);
    try {
        await chrome.tabs.sendMessage(tabId, message);
        console.log(`[Background] Successfully sent message to tab ${tabId} (Type: ${message.type}).`);
    } catch (error: any) {
        if (error.message && error.message.includes('Receiving end does not exist') && retries > 0) {
            console.warn(`[Background] Retrying message to tab ${tabId} (Type: ${message.type})... Retries left: ${retries - 1}`);
            await new Promise(resolve => setTimeout(resolve, delayMs)); // Wait before retrying
            await retrySendMessage(tabId, message, retries - 1, delayMs * 1.5); // Exponential backoff
        } else {
            console.error(`[Background] Failed to send message to tab ${tabId} (Type: ${message.type}):`, error);
        }
    }
}

// Listener for URL navigation requests (the pre-load check)
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        console.log(`[Background-WebReq] Intercepted: ${details.url}, Type: ${details.type}, TabId: ${details.tabId}`);

        if (bypassingTabs.has(details.tabId)) {
            console.log(`[Background-WebReq] Bypassing scan for tab ${details.tabId} (original URL: ${details.url}) due to 'continue' action.`);
            return { cancel: false };
        }

        if (details.type === "main_frame" &&
            (details.url.startsWith("http://") || details.url.startsWith("https://")) &&
            !details.url.startsWith(chrome.runtime.getURL(''))
        ) {
            const targetUrl = details.url;
            console.log(`[Background-WebReq] Processing main_frame URL: ${targetUrl}`);

            (async () => {
                let cachedEntry = null;
                const result = await chrome.storage.local.get('scanCache');
                const scanCache = result.scanCache || {};
                cachedEntry = scanCache[targetUrl];

                let trustScore: number;
                let alertMessage: string;

                if (cachedEntry && (Date.now() - cachedEntry.timestamp < SCAN_CACHE_DURATION_MS)) {
                    console.log(`[Background-WebReq] Using cached scan result for ${targetUrl} (pre-load).`);
                    trustScore = cachedEntry.score;
                    alertMessage = cachedEntry.message;
                } else {
                    const fetchedResult = await fetchTrustScoreFromBackend(targetUrl);
                    trustScore = fetchedResult.trustScore;
                    alertMessage = fetchedResult.alertMessage;

                    const cacheEntry = {
                        url: targetUrl,
                        score: trustScore,
                        message: alertMessage,
                        tabId: details.tabId,
                        timestamp: Date.now()
                    };
                    scanCache[targetUrl] = cacheEntry;
                    await chrome.storage.local.set({ scanCache: scanCache });
                    console.log(`[Background-WebReq] Cached new scan result for ${targetUrl}.`);
                }

                await chrome.storage.local.set({
                    phisherShieldAlertData: {
                        url: targetUrl,
                        score: trustScore,
                        message: alertMessage,
                        tabId: details.tabId
                    }
                });
                console.log(`[Background-WebReq] Stored alert data for overlay: ${targetUrl}.`);

                if (trustScore < 50) {
                    console.log(`[Background-WebReq] Score ${trustScore} is suspicious. Sending message to tab ${details.tabId} to display alert.`);
                    await retrySendMessage(details.tabId, { type: 'displayPhishingAlert' });
                } else {
                    console.log(`[Background-WebReq] Score ${trustScore} is safe. Allowing navigation for ${targetUrl}.`);
                    await retrySendMessage(details.tabId, { type: 'removePhishingAlert' }, 1);
                }
            })();

            return { cancel: false };
        }
        return { cancel: false };
    },
    { urls: ["<all_urls>"], types: ["main_frame"] },
    []
);

// Listener to clear the bypass flag once navigation has committed
chrome.webNavigation.onCommitted.addListener(details => {
    if (bypassingTabs.has(details.tabId) && details.frameId === 0) {
        bypassingTabs.delete(details.tabId);
        console.log(`[Background-WebNav] Cleared bypass flag for tab ${details.tabId} for URL: ${details.url}.`);
    }
}, { url: [{ urlMatches: "http://*/*" }, { urlMatches: "https://*/*" }] });


// --- CRITICAL FIX: Ensure only ONE chrome.runtime.onMessage.addListener ---
// This listener handles all message types coming from the content script or popup.
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === "userAction") {
        const { action, originalUrl, tabId } = message;
        console.log(`[Background] User action from alert overlay: ${action} for ${originalUrl} in tab ${tabId}`);

        if (action === "continue") {
            bypassingTabs.add(tabId);
            await retrySendMessage(tabId, { type: 'removePhishingAlert' }, 1);
            console.log(`[Background] Allowing interaction for ${originalUrl}.`);
        } else if (action === "report") {
            bypassingTabs.add(tabId);
            await retrySendMessage(tabId, { type: 'removePhishingAlert' }, 1);
            chrome.tabs.create({ url: `http://localhost:4000/report?url=${encodeURIComponent(originalUrl)}` });
            console.log(`[Background] Opened report page for ${originalUrl}`);
        } else if (action === "block") {
            bypassingTabs.add(tabId);
            await retrySendMessage(tabId, { type: 'removePhishingAlert' }, 1);
            chrome.tabs.update(tabId, { url: "about:blank" });
            console.log(`[Background] Blocked navigation for ${originalUrl}.`);
        }
    } else if (message.type === "pageContent") {
        console.log(`[Background] Received page content from content script (Tab: ${sender.tab?.id}, URL: ${message.url})`);
    } else if (message.type === "detectedRedirect") { // <--- NEW MESSAGE TYPE: Handle detected redirects here
        const { initialUrl, finalUrl, redirectType } = message;
        console.log(`[Background] Detected ${redirectType} redirect from ${initialUrl} to ${finalUrl}.`);
        // Here, you would typically send this to your backend if you want to apply a deduction
        // or trigger a notification based on this redirect.
        // Example of sending to backend for analysis (you'd need to adapt fetchTrustScoreFromBackend):
        // const { trustScore, alertMessage } = await fetchTrustScoreFromBackend(finalUrl, { redirectDetected: true, redirectType });
        // You could then trigger a notification or a follow-up action.
    }
    // Return nothing at the end of the listener.
    // Chrome will implicitly understand it as a synchronous completion, or that sendResponse is not called.
});