/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/background.ts":
/*!***************************!*\
  !*** ./src/background.ts ***!
  \***************************/
/***/ (function() {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// extension/src/background.ts
console.log('PhisherShield background service worker started (Corrected Message Listeners).');
// Define a flag to indicate if we are navigating after a 'continue' action
var bypassingTabs = new Set();
// Define cache duration (e.g., 5 minutes)
var SCAN_CACHE_DURATION_MS = 5 * 60 * 1000; // Cache results for 5 minutes (5 * 60 seconds * 1000 ms)
// Helper function to fetch trust score from your backend
function fetchTrustScoreFromBackend(url) {
    return __awaiter(this, void 0, void 0, function () {
        var response, errorText, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    console.log("[Background] Attempting to fetch trust score for: ".concat(url));
                    return [4 /*yield*/, fetch("http://localhost:4000/api/trustScore", {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: url, content: '' }), // Send empty content for pre-load scan
                        })];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.text()];
                case 2:
                    errorText = _a.sent();
                    console.error("[Background] Backend HTTP error for ".concat(url, ": Status ").concat(response.status, ", Message: ").concat(errorText));
                    return [2 /*return*/, { trustScore: 0, alertMessage: "Failed to scan site: Server error." }];
                case 3: return [4 /*yield*/, response.json()];
                case 4:
                    data = _a.sent();
                    console.log("[Background] Successfully fetched score for ".concat(url, ":"), data);
                    return [2 /*return*/, { trustScore: data.trustScore, alertMessage: data.alertMessage }];
                case 5:
                    error_1 = _a.sent();
                    console.error("[Background] Network error fetching trust score for ".concat(url, ":"), error_1);
                    return [2 /*return*/, { trustScore: 0, alertMessage: "Failed to scan site: Network error." }];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Attempts to send a message to a tab, retrying if 'Receiving end does not exist' error occurs.
 * @param tabId The ID of the target tab.
 * @param message The message object to send.
 * @param retries Remaining retry attempts.
 * @param delayMs Delay in milliseconds before next retry.
 */
function retrySendMessage(tabId_1, message_1) {
    return __awaiter(this, arguments, void 0, function (tabId, message, retries, delayMs) {
        var error_2;
        if (retries === void 0) { retries = 3; }
        if (delayMs === void 0) { delayMs = 200; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("[Background] Attempting to send message to tab ".concat(tabId, " (Type: ").concat(message.type, ", Retries left: ").concat(retries, ")"));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 8]);
                    return [4 /*yield*/, chrome.tabs.sendMessage(tabId, message)];
                case 2:
                    _a.sent();
                    console.log("[Background] Successfully sent message to tab ".concat(tabId, " (Type: ").concat(message.type, ")."));
                    return [3 /*break*/, 8];
                case 3:
                    error_2 = _a.sent();
                    if (!(error_2.message && error_2.message.includes('Receiving end does not exist') && retries > 0)) return [3 /*break*/, 6];
                    console.warn("[Background] Retrying message to tab ".concat(tabId, " (Type: ").concat(message.type, ")... Retries left: ").concat(retries - 1));
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delayMs); })];
                case 4:
                    _a.sent(); // Wait before retrying
                    return [4 /*yield*/, retrySendMessage(tabId, message, retries - 1, delayMs * 1.5)];
                case 5:
                    _a.sent(); // Exponential backoff
                    return [3 /*break*/, 7];
                case 6:
                    console.error("[Background] Failed to send message to tab ".concat(tabId, " (Type: ").concat(message.type, "):"), error_2);
                    _a.label = 7;
                case 7: return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
// Listener for URL navigation requests (the pre-load check)
chrome.webRequest.onBeforeRequest.addListener(function (details) {
    var _this = this;
    console.log("[Background-WebReq] Intercepted: ".concat(details.url, ", Type: ").concat(details.type, ", TabId: ").concat(details.tabId));
    if (bypassingTabs.has(details.tabId)) {
        console.log("[Background-WebReq] Bypassing scan for tab ".concat(details.tabId, " (original URL: ").concat(details.url, ") due to 'continue' action."));
        return { cancel: false };
    }
    if (details.type === "main_frame" &&
        (details.url.startsWith("http://") || details.url.startsWith("https://")) &&
        !details.url.startsWith(chrome.runtime.getURL(''))) {
        var targetUrl_1 = details.url;
        console.log("[Background-WebReq] Processing main_frame URL: ".concat(targetUrl_1));
        (function () { return __awaiter(_this, void 0, void 0, function () {
            var cachedEntry, result, scanCache, trustScore, alertMessage, fetchedResult, cacheEntry;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cachedEntry = null;
                        return [4 /*yield*/, chrome.storage.local.get('scanCache')];
                    case 1:
                        result = _a.sent();
                        scanCache = result.scanCache || {};
                        cachedEntry = scanCache[targetUrl_1];
                        if (!(cachedEntry && (Date.now() - cachedEntry.timestamp < SCAN_CACHE_DURATION_MS))) return [3 /*break*/, 2];
                        console.log("[Background-WebReq] Using cached scan result for ".concat(targetUrl_1, " (pre-load)."));
                        trustScore = cachedEntry.score;
                        alertMessage = cachedEntry.message;
                        return [3 /*break*/, 5];
                    case 2: return [4 /*yield*/, fetchTrustScoreFromBackend(targetUrl_1)];
                    case 3:
                        fetchedResult = _a.sent();
                        trustScore = fetchedResult.trustScore;
                        alertMessage = fetchedResult.alertMessage;
                        cacheEntry = {
                            url: targetUrl_1,
                            score: trustScore,
                            message: alertMessage,
                            tabId: details.tabId,
                            timestamp: Date.now()
                        };
                        scanCache[targetUrl_1] = cacheEntry;
                        return [4 /*yield*/, chrome.storage.local.set({ scanCache: scanCache })];
                    case 4:
                        _a.sent();
                        console.log("[Background-WebReq] Cached new scan result for ".concat(targetUrl_1, "."));
                        _a.label = 5;
                    case 5: return [4 /*yield*/, chrome.storage.local.set({
                            phisherShieldAlertData: {
                                url: targetUrl_1,
                                score: trustScore,
                                message: alertMessage,
                                tabId: details.tabId
                            }
                        })];
                    case 6:
                        _a.sent();
                        console.log("[Background-WebReq] Stored alert data for overlay: ".concat(targetUrl_1, "."));
                        if (!(trustScore < 50)) return [3 /*break*/, 8];
                        console.log("[Background-WebReq] Score ".concat(trustScore, " is suspicious. Sending message to tab ").concat(details.tabId, " to display alert."));
                        return [4 /*yield*/, retrySendMessage(details.tabId, { type: 'displayPhishingAlert' })];
                    case 7:
                        _a.sent();
                        return [3 /*break*/, 10];
                    case 8:
                        console.log("[Background-WebReq] Score ".concat(trustScore, " is safe. Allowing navigation for ").concat(targetUrl_1, "."));
                        return [4 /*yield*/, retrySendMessage(details.tabId, { type: 'removePhishingAlert' }, 1)];
                    case 9:
                        _a.sent();
                        _a.label = 10;
                    case 10: return [2 /*return*/];
                }
            });
        }); })();
        return { cancel: false };
    }
    return { cancel: false };
}, { urls: ["<all_urls>"], types: ["main_frame"] }, []);
// Listener to clear the bypass flag once navigation has committed
chrome.webNavigation.onCommitted.addListener(function (details) {
    if (bypassingTabs.has(details.tabId) && details.frameId === 0) {
        bypassingTabs.delete(details.tabId);
        console.log("[Background-WebNav] Cleared bypass flag for tab ".concat(details.tabId, " for URL: ").concat(details.url, "."));
    }
}, { url: [{ urlMatches: "http://*/*" }, { urlMatches: "https://*/*" }] });
// --- CRITICAL FIX: Ensure only ONE chrome.runtime.onMessage.addListener ---
// This listener handles all message types coming from the content script or popup.
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) { return __awaiter(void 0, void 0, void 0, function () {
    var action, originalUrl, tabId, initialUrl, finalUrl, redirectType;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!(message.type === "userAction")) return [3 /*break*/, 7];
                action = message.action, originalUrl = message.originalUrl, tabId = message.tabId;
                console.log("[Background] User action from alert overlay: ".concat(action, " for ").concat(originalUrl, " in tab ").concat(tabId));
                if (!(action === "continue")) return [3 /*break*/, 2];
                bypassingTabs.add(tabId);
                return [4 /*yield*/, retrySendMessage(tabId, { type: 'removePhishingAlert' }, 1)];
            case 1:
                _b.sent();
                console.log("[Background] Allowing interaction for ".concat(originalUrl, "."));
                return [3 /*break*/, 6];
            case 2:
                if (!(action === "report")) return [3 /*break*/, 4];
                bypassingTabs.add(tabId);
                return [4 /*yield*/, retrySendMessage(tabId, { type: 'removePhishingAlert' }, 1)];
            case 3:
                _b.sent();
                chrome.tabs.create({ url: "http://localhost:4000/report?url=".concat(encodeURIComponent(originalUrl)) });
                console.log("[Background] Opened report page for ".concat(originalUrl));
                return [3 /*break*/, 6];
            case 4:
                if (!(action === "block")) return [3 /*break*/, 6];
                bypassingTabs.add(tabId);
                return [4 /*yield*/, retrySendMessage(tabId, { type: 'removePhishingAlert' }, 1)];
            case 5:
                _b.sent();
                chrome.tabs.update(tabId, { url: "about:blank" });
                console.log("[Background] Blocked navigation for ".concat(originalUrl, "."));
                _b.label = 6;
            case 6: return [3 /*break*/, 8];
            case 7:
                if (message.type === "pageContent") {
                    console.log("[Background] Received page content from content script (Tab: ".concat((_a = sender.tab) === null || _a === void 0 ? void 0 : _a.id, ", URL: ").concat(message.url, ")"));
                }
                else if (message.type === "detectedRedirect") { // <--- NEW MESSAGE TYPE: Handle detected redirects here
                    initialUrl = message.initialUrl, finalUrl = message.finalUrl, redirectType = message.redirectType;
                    console.log("[Background] Detected ".concat(redirectType, " redirect from ").concat(initialUrl, " to ").concat(finalUrl, "."));
                    // Here, you would typically send this to your backend if you want to apply a deduction
                    // or trigger a notification based on this redirect.
                    // Example of sending to backend for analysis (you'd need to adapt fetchTrustScoreFromBackend):
                    // const { trustScore, alertMessage } = await fetchTrustScoreFromBackend(finalUrl, { redirectDetected: true, redirectType });
                    // You could then trigger a notification or a follow-up action.
                }
                _b.label = 8;
            case 8: return [2 /*return*/];
        }
    });
}); });


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/background.ts"]();
/******/ 	
/******/ })()
;
//# sourceMappingURL=background.js.map