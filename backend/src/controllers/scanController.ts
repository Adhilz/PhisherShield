// backend/src/controllers/scanController.ts
import { Request, Response } from 'express';
import axios from 'axios';
import https from 'https';
import { promises as dns } from 'dns'; // Corrected import for dns/promises
import psl from 'psl'; // Import psl library

// Using '../utils/TrustScore' based on common convention, but ensure your file is 'TrustScore.ts'
import { calculateTrustScoreWithGSBAndSSL, WhoisMetrics, TrustScoreResult, IpReputationMetrics, DnsRecordsMetrics } from '../utils/TrustScore';

// --- Helper Functions for External API Calls ---

// 1. Function to fetch WHOIS data from WhoisXML API
const fetchWhoisData = async (domain: string): Promise<WhoisMetrics> => {
    console.log(`[Backend] Fetching REAL WHOIS data for: ${domain}`);
    const WHOIS_XML_API_KEY = process.env.WHOIS_XML_API_KEY;

    if (!WHOIS_XML_API_KEY) {
        console.error("[Backend-WHOIS] WHOIS_XML_API_KEY is not set in environment variables. Falling back to mock data.");
        return { domainName: domain, estimatedDomainAge: 0, registrarName: 'UNKNOWN (API Key Missing)' };
    }

    try {
        const response = await axios.get(`https://www.whoisxmlapi.com/whoisserver/WhoisService?domainName=${domain}&apiKey=${WHOIS_XML_API_KEY}&outputFormat=JSON`);
        const whoisRecord = response.data.WhoisRecord;

        const createdDateStr = whoisRecord?.createdDate;
        let estimatedDomainAge: number | undefined;

        if (createdDateStr) {
            try {
                const created = new Date(createdDateStr);
                const now = new Date();
                estimatedDomainAge = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            } catch (dateError) {
                console.warn(`[Backend-WHOIS] Could not parse createdDate "${createdDateStr}" for domain ${domain}:`, dateError);
                estimatedDomainAge = undefined;
            }
        }

        const metrics: WhoisMetrics = {
            domainName: whoisRecord?.domainName,
            registrarName: whoisRecord?.registrarName,
            createdDate: whoisRecord?.createdDate,
            expiresDate: whoisRecord?.expiresDate,
            estimatedDomainAge: estimatedDomainAge
        };
        console.log(`[Backend-WHOIS] WHOIS data fetched for ${domain}:`, metrics);
        return metrics;

    } catch (error) {
        console.error(`[Backend-WHOIS] Error fetching WHOIS data for ${domain}:`, error instanceof Error ? error.message : error);
        return { domainName: domain, estimatedDomainAge: 0, registrarName: 'Error/Unavailable' };
    }
};

// 2. Function to check URL against Google Safe Browsing API
const checkGoogleSafeBrowse = async (url: string): Promise<any> => {
    console.log(`[Backend-GSB] Checking REAL Google Safe Browse for: ${url}`);
    const GOOGLE_SAFE_Browse_API_KEY = process.env.GOOGLE_SAFE_Browse_API_KEY; 

    if (!GOOGLE_SAFE_Browse_API_KEY) {
        console.error("[Backend-GSB] GOOGLE_SAFE_Browse_API_KEY is not set in environment variables. Assuming safe.");
        return { matches: [] };
    }

    try {
        const requestBody = {
            client: {
                clientId: "PhisherShield",
                clientVersion: "1.0.0"
            },
            threatInfo: {
                threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                platformTypes: ["ANY_PLATFORM"],
                threatEntryTypes: ["URL"],
                threatEntries: [{ url: url }]
            }
        };
        console.log("[Backend-GSB] Sending GSB request body:", JSON.stringify(requestBody, null, 2));

        const GSB_API_ENDPOINT = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_SAFE_Browse_API_KEY}`;
        console.log(`[Backend-GSB] GSB API endpoint used: ${GSB_API_ENDPOINT}`);

        const response = await axios.post(GSB_API_ENDPOINT, requestBody, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log(`[Backend-GSB] GSB API Raw Response Status: ${response.status}`);
        console.log(`[Backend-GSB] GSB API Raw Response Data:`, response.data);
        return response.data;
    } catch (error: any) {
        console.error(`[Backend-GSB] Error calling GSB API for ${url}:`, error instanceof Error ? error.message : error);
        if (axios.isAxiosError(error) && error.response) {
            console.error(`[Backend-GSB] GSB API Error Status: ${error.response.status}, Data:`, error.response.data);
            console.error(`[Backend-GSB] Error URL was: ${error.config?.url}`);
        }
        return { matches: [] };
    }
};

// 3. Function to perform a basic SSL certificate validation
const performSslCheck = async (url: string): Promise<boolean> => {
    console.log(`[Backend] Performing REAL SSL check for: ${url}`);
    if (!url.startsWith('https://')) {
        console.log(`[Backend-SSL] URL is not HTTPS: ${url}`);
        return false;
    }

    return new Promise((resolve) => {
        const parsedUrl = new URL(url);
        const options = {
            hostname: parsedUrl.hostname,
            port: 443,
            method: 'HEAD',
            rejectUnauthorized: false
        };

        const req = https.request(options, (res) => {
            console.log(`[Backend-SSL] SSL check for ${url}: Status Code: ${res.statusCode}, Socket Authorized: ${(res.socket as any)?.authorized}`);

            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
                 console.log(`[Backend-SSL] Connected successfully (Status ${res.statusCode}), SSL considered present for ${url}`);
                 resolve(true);
            } else {
                console.log(`[Backend-SSL] Non-successful status code (${res.statusCode}) for ${url}, SSL may be invalid or connection issue.`);
                resolve(false);
            }
        });

        req.on('error', (e: Error) => {
            console.error(`[Backend-SSL] SSL check error for ${url}:`, e.message);
            resolve(false);
        });

        req.end();
    });
};

// Helper to get domain's primary IP address (IPv4)
const resolveDomainToIp = async (domain: string): Promise<string | null> => {
    try {
        const addresses = await dns.resolve4(domain);
        if (addresses.length > 0) {
            console.log(`[Backend-DNS] Resolved ${domain} to IP: ${addresses[0]}`);
            return addresses[0];
        }
        console.warn(`[Backend-DNS] No IPv4 addresses found for ${domain}`);
        return null;
    } catch (error) {
        console.error(`[Backend-DNS] Error resolving domain ${domain}:`, error);
        return null;
    }
};

// Implement IP Reputation Check (AbuseIPDB)
const checkIpReputation = async (ipAddress: string): Promise<any> => {
    console.log(`[Backend] Checking IP reputation for: ${ipAddress}`);
    const ABUSE_IPDB_API_KEY = process.env.ABUSE_IPDB_API_KEY;

    if (!ABUSE_IPDB_API_KEY) {
        console.error("[Backend-IPRep] ABUSE_IPDB_API_KEY is not set. Skipping IP reputation check.");
        return { abuseConfidenceScore: 0, isWhitelisted: false };
    }

    try {
        const response = await axios.get(`https://api.abuseipdb.com/api/v2/check`, {
            headers: {
                'Key': ABUSE_IPDB_API_KEY,
                'Accept': 'application/json'
            },
            params: {
                ipAddress: ipAddress,
                maxAgeInDays: 90, // Check for reports within the last 90 days
                verbose: '' // Include verbose output
            }
        });
        console.log(`[Backend-IPRep] AbuseIPDB result for ${ipAddress}:`, response.data.data);
        return response.data.data;
    } catch (error) {
        console.error(`[Backend-IPRep] Error checking IP reputation for ${ipAddress}:`, error instanceof Error ? error.message : error);
        if (axios.isAxiosError(error) && error.response) {
            console.error(`[Backend-IPRep] AbuseIPDB API Error Status: ${error.response.status}, Data:`, error.response.data);
        }
        return { abuseConfidenceScore: 0, isWhitelisted: false };
    }
};

// Helper to get the root domain from a hostname
const getRootDomain = (hostname: string): string => {
    const parsed = psl.parse(hostname);
    return parsed && typeof parsed === 'object' && 'domain' in parsed && parsed.domain
        ? parsed.domain
        : hostname;
};


const verifyDnsRecords = async (domain: string): Promise<{ hasSPF: boolean; hasDMARC: boolean }> => {
    const rootDomain = getRootDomain(domain);
    console.log(`[Backend] Verifying DNS records for: ${domain} (root: ${rootDomain})`);

    let hasSPF = false;
    let hasDMARC = false;

    try {
        console.log(`[Backend-DNS] Attempting to resolve TXT for SPF for domain: ${rootDomain}`);
        const txtRecords = await dns.resolveTxt(rootDomain).catch((error) => {
            console.error(`[Backend-DNS] Error resolving SPF TXT for ${rootDomain}:`, error);
            return [] as string[][];
        });
        console.log(`[Backend-DNS] Raw SPF TXT records for ${rootDomain}:`, txtRecords);
        hasSPF = txtRecords.some((record: string[]) =>
            record.some((str: string) => str.toLowerCase().startsWith('v=spf1'))
        );
        console.log(`[Backend-DNS] ${rootDomain} has SPF record: ${hasSPF}`);
    } catch (error: any) {
        console.warn(`[Backend-DNS] Outer catch for SPF for ${rootDomain}:`, error);
    }

    try {
        let dmarcDomain = `_dmarc.${rootDomain}`;
        console.log(`[Backend-DNS] Attempting to resolve TXT for DMARC for domain: ${dmarcDomain}`);
        const dmarcTxtRecords = await dns.resolveTxt(dmarcDomain).catch((error) => {
            console.error(`[Backend-DNS] Error resolving DMARC TXT for ${dmarcDomain}:`, error);
            return [] as string[][];
        });
        console.log(`[Backend-DNS] Raw DMARC TXT records for ${dmarcDomain}:`, dmarcTxtRecords);
        hasDMARC = dmarcTxtRecords.some((record: string[]) =>
            record.some((str: string) => str.toLowerCase().startsWith('v=dmarc1'))
        );
        console.log(`[Backend-DNS] ${rootDomain} has DMARC record: ${hasDMARC}`);
    } catch (error: any) {
        console.warn(`[Backend-DNS] Outer catch for DMARC for ${rootDomain}:`, error);
    }

    return { hasSPF, hasDMARC };
};

// --- NEW: Function to get AI-generated score from Gemini API ---
const getGeminiAiScore = async (url: string, pageContent: string): Promise<{ score: number; reason: string } | null> => {
    console.log(`[Backend-Gemini] Requesting AI score for: ${url}`);
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        console.error("[Backend-Gemini] GEMINI_API_KEY is not set. Skipping Gemini AI score.");
        return null;
    }

    let prompt = `Analyze the following URL and its content for signs of phishing, scam, or malicious intent. Provide a single numerical score from 0 (highly suspicious) to 100 (completely safe). Explain your reasoning in one sentence.
    URL: ${url}
    Content (if available): ${pageContent ? pageContent.substring(0, 2000) + '...' : 'No content provided.'}

    Respond in JSON format: {"score": <number>, "reason": "<string>"}`;

    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    try {
        const payload = {
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "score": { "type": "NUMBER" },
                        "reason": { "type": "STRING" }
                    },
                    required: ["score", "reason"]
                }
            }
        };

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
        console.log(`[Backend-Gemini] Sending request to Gemini API: ${apiUrl}`);

        const response = await axios.post(apiUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000 // Set a timeout for the request
        });

        const result = response.data;
        console.log(`[Backend-Gemini] Raw API Response:`, JSON.stringify(result, null, 2));
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const jsonString = result.candidates[0].content.parts[0].text;
            console.log(`[Backend-Gemini] Raw JSON String from AI:`, jsonString);
            try {
                const parsedJson = JSON.parse(jsonString);
                if (typeof parsedJson.score === 'number' && typeof parsedJson.reason === 'string') {
                    console.log(`[Backend-Gemini] Successfully parsed AI response.`);
                    return {
                        score: Math.max(0, Math.min(100, parsedJson.score)),
                        reason: parsedJson.reason
                    };
                } else {
                    console.warn("[Backend-Gemini] Parsed AI response missing 'score' or 'reason' or has wrong types.", parsedJson);
                    return null;
                }
            } catch (jsonParseError) {
                console.error("[Backend-Gemini] Failed to parse JSON from AI response:", jsonParseError);
                console.error("[Backend-Gemini] Problematic JSON string:", jsonString);
                return null;
            }
        } else {
            console.warn("[Backend-Gemini] Gemini API response structure unexpected or no candidates.");
            return null;
        }
    } catch (error: any) {
        console.error(`[Backend-Gemini] Error calling Gemini API for ${url}:`, error instanceof Error ? error.message : error);
        if (axios.isAxiosError(error) && error.response) {
            console.error(`[Backend-Gemini] Gemini API Error Status: ${error.response.status}, Data:`, JSON.stringify(error.response.data, null, 2));
        } else if (error.code === 'ECONNABORTED') {
            console.error("[Backend-Gemini] Gemini API call timed out.");
        }
        return null;
    }
};
const fetchReportCount = async (url: string): Promise<number> => {
    console.log(`[Backend] Fetching report count for: ${url}`);
    try {
        // Call your own backend API endpoint for report count
        // THIS IS THE LINE THAT'S GETTING THE 401
        const response = await axios.get(`http://localhost:4000/api/report/count?url=${encodeURIComponent(url)}`);
        console.log(`[Backend-ReportCount] Report count for ${url}: ${response.data.reportCount}`);
        return response.data.reportCount;
    } catch (error) {
        console.error(`[Backend-ReportCount] Error fetching report count for ${url}:`, error instanceof Error ? error.message : error);
        return 0; // Default to 0 reports on error
    }
};

/**
 * Core function to perform a scan and calculate the trust score.
 * This function now RETURNS the result, instead of sending an Express response.
 */
export const performScanAndCalculateScore = async (
    url: string,
    content: string = '',
    redirectType: string | null = null
): Promise<{ trustScore: number; alertMessage: string; deductions: string[]; geminiAiScore: number | null; geminiAiReason: string | null; reportCount: number }> => {
    console.log(`[Backend-Controller] Performing scan for URL: ${url}`);

    try {
        let domain: string;
        try {
            domain = new URL(url).hostname;
        } catch (e) {
            console.error(`[Backend-Controller] Invalid URL provided: ${url}`, e);
            return { trustScore: 0, alertMessage: "Invalid URL format provided.", deductions: ['Malformed URL'], geminiAiScore: null, geminiAiReason: null, reportCount: 0 };
        }
        console.log(`[Backend-Controller] Extracted domain: ${domain}`);

        // TEMPORARY: FORCED LOW SCORE FOR TESTING OVERLAY
        if (domain === 'example.com') {
            console.log(`[Backend-Controller] FORCING LOW SCORE for ${domain} to test alert overlay.`);
            return { trustScore: 10, alertMessage: 'WARNING: Forced suspicious score for testing overlay on reachable site! 🚨', deductions: ['Forced low score'], geminiAiScore: null, geminiAiReason: null, reportCount: 0 };
        }
        // END TEMPORARY FORCED LOW SCORE


        const whoisData = await fetchWhoisData(domain);
        console.log(`[Backend-Controller] WHOIS data fetched:`, whoisData);

        const gsbResult = await checkGoogleSafeBrowse(url);
        console.log(`[Backend-Controller] GSB result fetched:`, gsbResult);

        const sslValid = await performSslCheck(url);
        console.log(`[Backend-Controller] SSL valid: ${sslValid}`);

        const ipAddress = await resolveDomainToIp(domain);
        let ipReputation: IpReputationMetrics = { abuseConfidenceScore: 0, isWhitelisted: false };
        if (ipAddress) {
            ipReputation = await checkIpReputation(ipAddress);
        }
        console.log(`[Backend-Controller] IP Rep:`, ipReputation);

        const dnsRecords = await verifyDnsRecords(domain);
        console.log(`[Backend-Controller] DNS Records:`, dnsRecords);

        const geminiAiResult = await getGeminiAiScore(url, content);
        const geminiAiScore = geminiAiResult ? geminiAiResult.score : null;
        const geminiAiReason = geminiAiResult ? geminiAiResult.reason : null;
        console.log(`[Backend-Controller] Gemini AI Score: ${geminiAiScore}, Reason: ${geminiAiReason}`);

        const reportCount = await fetchReportCount(url); // Fetch report count

        const { score, deductions }: TrustScoreResult = calculateTrustScoreWithGSBAndSSL(
            whoisData,
            gsbResult,
            sslValid,
            content,
            url, // originalUrl
            ipReputation,
            dnsRecords,
            redirectType,
            geminiAiScore,
            reportCount // This parameter is correctly passed here
        );
        console.log(`[Backend-Controller] Calculated Score: ${score}, Deductions:`, deductions);

        let alertMessage: string;
        if (score >= 80) {
            alertMessage = 'This site appears highly trustworthy. ✅';
        } else if (score >= 50) {
            alertMessage = `This site has some minor concerns. Score: ${score}. Deductions: ${deductions.join(', ')}. 🤔`;
        } else {
            alertMessage = `WARNING: This site is suspicious! Score: ${score}. Deductions: ${deductions.join(', ')}. 🚨`;
        }
        console.log(`[Backend-Controller] Final Alert Message: ${alertMessage}`);

        return { trustScore: score, alertMessage, deductions, geminiAiScore, geminiAiReason, reportCount };
    } catch (error) {
        console.error(`[Backend-Controller] Unexpected error during scan for ${url}:`, error);
        return { trustScore: 0, alertMessage: `Error scanning site: ${error instanceof Error ? error.message : String(error)}.`, deductions: ['Internal error'], geminiAiScore: null, geminiAiReason: null, reportCount: 0 };
    }
};

/**
 * Express controller function to handle the /api/trustScore POST request.
 * This calls performScanAndCalculateScore and sends the HTTP response.
 */
export const scanUrlAndRespond = async (req: Request, res: Response) => {
    const { url, content, redirectType } = req.body;

    if (!url) {
        return res.status(400).json({ message: 'URL is required in the request body.' });
    }

    try {
        const scanResult = await performScanAndCalculateScore(url, content, redirectType);
        res.json({
            trustScore: scanResult.trustScore,
            alertMessage: scanResult.alertMessage,
            deductions: scanResult.deductions,
            geminiAiScore: scanResult.geminiAiScore,
            geminiAiReason: scanResult.geminiAiReason,
            reportCount: scanResult.reportCount
        });
    } catch (error) {
        console.error(`[Backend-Controller] Error in scanUrlAndRespond for ${url}:`, error);
        res.status(500).json({
            trustScore: 0,
            alertMessage: `Error processing scan.`,
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
