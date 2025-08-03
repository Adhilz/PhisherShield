// extension/src/content.ts
import React from 'react';
import ReactDOMClient from 'react-dom/client'; // Use ReactDOMClient for client-side rendering
import AlertPage from './pages/AlertPage'; // Import AlertPage component
import alertOverlayStyles from './styles/alert-overlay.css'; // IMPORTS CSS AS A STRING

console.log('PhisherShield content script loaded.');

let alertOverlayRoot: ReactDOMClient.Root | null = null;
let alertOverlayContainer: HTMLDivElement | null = null;

// --- Function to manually inject CSS ---
function injectCss(cssString: string) {
    // Remove any existing PhisherShield styles to prevent conflicts
    const existingStyles = document.querySelectorAll('style[data-phishershield]');
    existingStyles.forEach(style => style.remove());
    
    const styleTag = document.createElement('style');
    styleTag.setAttribute('data-phishershield', 'true');
    styleTag.textContent = cssString;
    // Append to document.documentElement (<html>) for more robust full-screen coverage
    (document.head || document.documentElement).appendChild(styleTag);
    console.log('[Content Script] Injected alert-overlay.css dynamically with unique identifier.');
}

// <--- CRITICAL FIX: Ensure this call is ONLY here, immediately after the function definition.
// It will be the first function call after global variable declarations.
injectCss(alertOverlayStyles);

// Also inject CSS when DOM is ready to ensure it's applied
document.addEventListener('DOMContentLoaded', () => {
    injectCss(alertOverlayStyles);
});


// --- Function to detect client-side redirects ---
// NEW: Global variable to track if redirect is initiated by our extension
let initiatedByExtension = false;
// Note: The listener to update initiatedByExtension is at the bottom of the file.

function detectClientSideRedirects() {
    if (initiatedByExtension) {
        console.log('[Content Script] Skipping redirect detection: Initiated by extension.');
        return; // Don't flag our own redirects
    }

    const currentUrl = window.location.href;
    const navigationEntries = window.performance.getEntriesByType('navigation');
    const initialUrl = navigationEntries.length > 0 ? navigationEntries[0].name : currentUrl;


    // 1. Detect if a redirect happened instantly on page load (via JS or Meta Refresh before DOM Ready)
    if (currentUrl !== initialUrl) {
        console.log(`[Content Script] Detected instant redirect! From: ${initialUrl} To: ${currentUrl}`);
        chrome.runtime.sendMessage({
            type: 'detectedRedirect',
            initialUrl: initialUrl,
            finalUrl: currentUrl,
            redirectType: 'instant_onload'
        }).catch(e => console.warn(`[Content Script] Failed to send redirect message: ${e.message}`));
        return; // Exit after detecting instant redirect
    }


    // 2. Monitor for JavaScript redirects after page load
    //const originalLocationSetter = Object.getOwnPropertyDescriptor(window, 'location')?.set;

    //if (originalLocationSetter) {
    //    Object.defineProperty(window, 'location', {
    //        configurable: true,
 //       enumerable: true,
    //        get() { return window.location.href; },
    //        set(v) {
    //            const newUrl = v.toString();
    //            if (newUrl && newUrl !== window.location.href && !initiatedByExtension) {
    //                console.log(`[Content Script] Detected JS redirect via setter! From: ${window.location.href} To: ${newUrl}`);
    //                chrome.runtime.sendMessage({
    //                    initialUrl: window.location.href,
    //                    finalUrl: newUrl,
    //                    redirectType: 'js_dynamic_setter'
 //               }).catch(e => console.warn(`[Content Script] Failed to send redirect message: ${e.message}`));
    //            }
    //            return originalLocationSetter.call(window.location, v);
 //}
    //    });
   // } else {
//   console.warn('[Content Script] Could not redefine window.location setter.');
   // }


    // 3. Check for meta refresh tags
    const metaRefresh = document.querySelector('meta[http-equiv="refresh"]') as HTMLMetaElement;
    if (metaRefresh && metaRefresh.content) {
        const content = metaRefresh.content;
        const match = content.match(/url=(.*)/i);
        const redirectUrl = match ? match[1].trim() : '';
        if (redirectUrl && redirectUrl !== currentUrl && !initiatedByExtension) {
            console.log(`[Content Script] Detected Meta Refresh redirect to: ${redirectUrl}`);
            chrome.runtime.sendMessage({
                type: 'detectedRedirect',
                initialUrl: currentUrl,
                finalUrl: redirectUrl,
                redirectType: 'meta_refresh'
            }).catch(e => console.warn(`[Content Script] Failed to send redirect message: ${e.message}`));
        }
    }
}

// Add listeners to call redirect detection very early and after page load
window.addEventListener('DOMContentLoaded', detectClientSideRedirects);
window.addEventListener('load', detectClientSideRedirects);


/**
 * Extracts all visible text from the document body, excluding script and style tags.
 */
function extractPageText(): string {
    const body = document.body;
    if (!body) return '';

    const clone = body.cloneNode(true) as HTMLElement;

    ['script', 'style', 'noscript', 'iframe', 'svg', 'canvas', 'img', 'video', 'audio', 'header', 'footer', 'nav', 'aside'].forEach(tag => {
        clone.querySelectorAll(tag).forEach(el => el.remove());
    });

    const text = clone.textContent || '';
    return text.replace(/\s+/g, ' ').trim();
}

/**
 * Injects the AlertPage React component as a full-screen overlay.
 */
function displayPhishingAlertOverlay() {
    console.log('[Content Script] Attempting to display alert overlay.');
    if (alertOverlayRoot) {
        console.log('[Content Script] Alert overlay already exists, not re-creating.');
        return;
    }

    try {
        alertOverlayContainer = document.createElement('div');
        alertOverlayContainer.id = 'phisher-shield-alert-overlay-container';
        Object.assign(alertOverlayContainer.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: '2147483647',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            pointerEvents: 'auto'
        });

        document.documentElement.appendChild(alertOverlayContainer);

        alertOverlayRoot = ReactDOMClient.createRoot(alertOverlayContainer);
        alertOverlayRoot.render(React.createElement(AlertPage));

        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        console.log('[Content Script] Alert overlay displayed successfully.');
    } catch (error) {
        console.error('[Content Script] Error displaying alert overlay:', error);
        if (alertOverlayContainer) {
            alertOverlayContainer.remove();
            alertOverlayContainer = null;
            alertOverlayRoot = null;
        }
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
    
    }
}

/**
 * Removes the AlertPage React component and its container.
 */
function removePhishingAlertOverlay() {
    console.log('[Content Script] Received request to remove phishing alert overlay.');
    if (alertOverlayRoot && alertOverlayContainer) {
        alertOverlayRoot.unmount();
        alertOverlayContainer.remove();
        alertOverlayRoot = null;
        alertOverlayContainer = null;
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        console.log('[Content Script] Alert overlay removed.');
    } else {
        console.log('[Content Script] No alert overlay found to remove.');
    }
}

// Listener for messages from the background script or popup
console.log('[Content Script] Registering chrome.runtime.onMessage listener.');
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => { // _sender is used to suppress unused var warning
    console.log(`[Content Script] Message RECEIVED: ${message.type}`);
    try {
        if (message.type === 'extractPageContent') {
            console.log('[Content Script] Handling extractPageContent.');
            const pageContent = extractPageText();
            sendResponse({ content: pageContent });
            return true;
        }
        else if (message.type === 'displayPhishingAlert') {
            console.log('[Content Script] Handling displayPhishingAlert.');
            displayPhishingAlertOverlay();
        } else if (message.type === 'removePhishingAlert') {
            console.log('[Content Script] Handling removePhishingAlert.');
            removePhishingAlertOverlay();
        }
        // NEW: Update initiatedByExtension flag based on messages from background/popup
        else if (message.type === 'userAction') { // User clicks 'continue'/'block'
            initiatedByExtension = true;
            setTimeout(() => { initiatedByExtension = false; }, 1000); // Reset after 1 second
            console.log('[Content Script] Flagged as extension-initiated due to userAction.');
        } else if (message.type === 'removePhishingAlert') { // Background explicitly asks to remove
            initiatedByExtension = true;
            setTimeout(() => { initiatedByExtension = false; }, 1000);
            console.log('[Content Script] Flagged as extension-initiated due to removePhishingAlert.');
        }
    } catch (error) {
        console.error(`[Content Script] Error processing message type ${message.type}:`, error);
    }
});
