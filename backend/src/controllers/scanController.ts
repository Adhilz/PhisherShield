// backend/src/controllers/scanController.ts
import { Request, Response } from 'express';
import axios from 'axios';
import https from 'https';
import { promises as dns } from 'dns';
import psl from 'psl';

 // <--- ADDED: for promise-based DNS resolution
// Using '../utils/TrustScore' based on common convention, but ensure your file is 'TrustScore.ts'
import { calculateTrustScoreWithGSBAndSSL, WhoisMetrics, TrustScoreResult } from '../utils/TrustScore'; // IpReputationMetrics, DnsRecordsMetrics will be added later

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

// 2. Function to check URL against Google Safe Browse API
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

        const response = await axios.post(GSB_API_ENDPOINT, requestBody);

        console.log(`[Backend-GSB] GSB API Raw Response Status: ${response.status}`);
        console.log(`[Backend-GSB] GSB API Raw Response Data:`, response.data);
        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            console.error(`[Backend-GSB] Axios Error for ${url}: Status ${error.response.status}, Data:`, error.response.data);
            console.error(`[Backend-GSB] Error URL was: ${error.config?.url}`);
        } else {
            console.error(`[Backend-GSB] General Error checking Google Safe Browse for ${url}:`, error);
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

// --- NEW: Helper to get domain's primary IP address (IPv4) ---
const resolveDomainToIp = async (domain: string): Promise<string | null> => {
    try {
        const addresses = await dns.resolve4(domain); // Resolve IPv4 addresses
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

// --- NEW: Implement IP Reputation Check (AbuseIPDB) ---
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
        return response.data.data; // Contains abuseConfidenceScore, totalReports, etc.
    } catch (error) {
        console.error(`[Backend-IPRep] Error checking IP reputation for ${ipAddress}:`, error instanceof Error ? error.message : error);
        if (axios.isAxiosError(error) && error.response) {
            console.error(`[Backend-IPRep] AbuseIPDB API Error Status: ${error.response.status}, Data:`, error.response.data);
        }
        return { abuseConfidenceScore: 0, isWhitelisted: false }; // Default to safe on error
    }
};

// --- DNS Record Verification (SPF/DMARC) - Will be added in TrustScore.ts ---
// (Function will be moved to TrustScore.ts if needed for separate use, but logic remains similar)
// backend/src/controllers/scanController.ts

// ... (rest of the file) ...


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
    } catch (error) {
        console.warn(`[Backend-DNS] Outer catch for SPF for ${rootDomain}:`, error);
    }

    try {
        const dmarcDomain = `_dmarc.${rootDomain}`;
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
    } catch (error) {
        console.warn(`[Backend-DNS] Outer catch for DMARC for ${rootDomain}:`, error);
    }

    return { hasSPF, hasDMARC };
};


// ... (rest of scanController.ts) ...

// --- Main controller function to handle the /api/trustScore POST request ---
export const getTrustScore = async (req: Request, res: Response) => {
    const { url, content } = req.body;

    if (!url) {
        console.error('[Backend-Controller] Error: URL is missing in request body.');
        return res.status(400).json({ message: 'URL is required in the request body.' });
    }

    console.log(`[Backend-Controller] Received POST request to scan URL: ${url}`);

    try {
        let domain: string;
        try {
            domain = new URL(url).hostname;
        } catch (e) {
            console.error(`[Backend-Controller] Invalid URL provided: ${url}`, e);
            return res.status(400).json({ trustScore: 0, alertMessage: "Invalid URL format provided." });
        }
        console.log(`[Backend-Controller] Extracted domain: ${domain}`);

        // TEMPORARY: FORCED LOW SCORE FOR TESTING OVERLAY (Keep as is)
        if (domain === 'example.com') {
            console.log(`[Backend-Controller] FORCING LOW SCORE for ${domain} to test alert overlay.`);
            return res.json({
                trustScore: 10,
                alertMessage: 'WARNING: Forced suspicious score for testing overlay on reachable site! 🚨'
            });
        }
        // END TEMPORARY FORCED LOW SCORE


        // 2. Fetch data from external sources
        const whoisData = await fetchWhoisData(domain);
        console.log(`[Backend-Controller] WHOIS data fetched:`, whoisData);

        const gsbResult = await checkGoogleSafeBrowse(url);
        console.log(`[Backend-Controller] GSB result fetched:`, gsbResult);

        const sslValid = await performSslCheck(url);
        console.log(`[Backend-Controller] SSL valid: ${sslValid}`);

        // NEW: Resolve IP and perform IP reputation check
        const ipAddress = await resolveDomainToIp(domain);
        let ipReputation = { abuseConfidenceScore: 0, isWhitelisted: false }; // Default safe
        if (ipAddress) {
            ipReputation = await checkIpReputation(ipAddress);
        }
        console.log(`[Backend-Controller] IP Rep:`, ipReputation);

        // NEW: Verify DNS records
        const dnsRecords = await verifyDnsRecords(domain);
        console.log(`[Backend-Controller] DNS Records:`, dnsRecords);


        // 3. Calculate trust score using your utility function, passing new data
        const { score, deductions }: TrustScoreResult = calculateTrustScoreWithGSBAndSSL(
            whoisData,
            gsbResult,
            sslValid,
            content,
            url, // originalUrl for URL pattern analysis
            ipReputation, // <--- NEW PARAMETER
            dnsRecords // <--- NEW PARAMETER
        );
        console.log(`[Backend-Controller] Calculated Score: ${score}, Deductions:`, deductions);

        // 4. Construct an alert message based on the calculated score and deductions
        let alertMessage: string;
        if (score >= 80) {
            alertMessage = 'This site appears highly trustworthy. ✅';
        } else if (score >= 50) {
            alertMessage = `This site has some minor concerns. Score: ${score}. Deductions: ${deductions.join(', ')}. 🤔`;
        } else {
            alertMessage = `WARNING: This site is suspicious! Score: ${score}. Deductions: ${deductions.join(', ')}. 🚨`;
        }
        console.log(`[Backend-Controller] Final Alert Message: ${alertMessage}`);

        // 5. Send the response back to the frontend (extension popup)
        res.json({ trustScore: score, alertMessage });

    } catch (error) {
        console.error(`[Backend-Controller] Unexpected error processing scan for ${url}:`, error);
        res.status(500).json({
            trustScore: 0,
            alertMessage: `Error scanning site: ${error instanceof Error ? error.message : String(error)}. Please check backend logs.`,
            error: error instanceof Error ? error.message : String(error)
        });
    }
};