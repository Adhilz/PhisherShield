// backend/src/utils/TrustScore.ts

export type WhoisMetrics = {
    domainName?: string;
    registrarName?: string;
    createdDate?: string;
    expiresDate?: string;
    estimatedDomainAge?: number;
};

// NEW: Define types for IP Reputation to match what the controller sends
export interface IpReputationMetrics {
    abuseConfidenceScore: number;
    isWhitelisted: boolean;
    // Add more fields from AbuseIPDB response if you use them in logic, e.g.:
    // totalReports?: number;
    // domain?: string;
    // countryCode?: string;
    // isPublic?: boolean;
    // lastReportedAt?: string;
}

// NEW: Define types for DNS Records to match what the controller sends
export interface DnsRecordsMetrics {
    hasSPF: boolean;
    hasDMARC: boolean;
    // Add hasDKIM if you implement it
}


export type TrustScoreResult = {
    score: number;
    deductions: string[];
};

export const calculateTrustScore = (whois: WhoisMetrics): TrustScoreResult => {
    let score = 100;
    const deductions: string[] = [];

    // Penalize very new domains
    if (whois.estimatedDomainAge !== undefined && whois.estimatedDomainAge < 180) {
        score -= 40;
        deductions.push('Domain age < 180 days (-40)');
    } else if (whois.estimatedDomainAge !== undefined && whois.estimatedDomainAge < 365) {
        score -= 20;
        deductions.push('Domain age < 365 days (-20)');
    }

    // Penalize suspicious registrar (example logic)
    if (whois.registrarName && whois.registrarName.toLowerCase().includes('privacy')) {
        score -= 10;
        deductions.push("Registrar contains 'privacy' (-10)");
    }

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));
    return { score, deductions };
};

export const calculateTrustScoreWithGSB = (
    whois: WhoisMetrics,
    gsbResult: any
): TrustScoreResult => {
    let score = 100;
    const deductions: string[] = [];

    // WHOIS deductions (as before)
    if (whois.estimatedDomainAge !== undefined && whois.estimatedDomainAge < 180) {
        score -= 40;
        deductions.push('Domain age < 180 days (-40)');
    } else if (whois.estimatedDomainAge !== undefined && whois.estimatedDomainAge < 365) {
        score -= 20;
        deductions.push('Domain age < 365 days (-20)');
    }
    if (whois.registrarName && whois.registrarName.toLowerCase().includes('privacy')) {
        score -= 10;
        deductions.push("Registrar contains 'privacy' (-10)");
    }

    // Google Safe Browse deduction
    if (gsbResult && gsbResult.matches && gsbResult.matches.length > 0) {
        score -= 50;
        deductions.push('Flagged by Google Safe Browse (-50)');
    }

    score = Math.max(0, Math.min(100, score));
    return { score, deductions };
};

export const calculateTrustScoreWithGSBAndSSL = (
    whois: WhoisMetrics,
    gsbResult: any,
    sslValid: boolean,
    pageContent: string = '',
    originalUrl: string,
    ipReputation: IpReputationMetrics, // <--- NEW PARAMETER
    dnsRecords: DnsRecordsMetrics // <--- NEW PARAMETER
): TrustScoreResult => {
    let score = 100;
    const deductions: string[] = [];

    // WHOIS deductions
    if (whois.estimatedDomainAge !== undefined && whois.estimatedDomainAge < 180) {
        score -= 40;
        deductions.push('Domain age < 180 days (-40)');
    } else if (whois.estimatedDomainAge !== undefined && whois.estimatedDomainAge < 365) {
        score -= 20;
        deductions.push('Domain age < 365 days (-20)');
    }
    if (whois.registrarName && whois.registrarName.toLowerCase().includes('privacy')) {
        score -= 10;
        deductions.push("Registrar contains 'privacy' (-10)");
    }

    // Google Safe Browse deduction
    if (gsbResult && gsbResult.matches && gsbResult.matches.length > 0) {
        score -= 50;
        deductions.push('Flagged by Google Safe Browse (-50)');
    }

    // SSL deduction
    if (!sslValid) {
        score -= 20;
        deductions.push('SSL certificate missing or invalid (-20)');
    }

    // Suspicious Keywords in Page Content
    const suspiciousKeywords = [
        'account locked', 'verify your account', 'urgent action required',
        'payment update', 'click here to login', 'reset password now',
        'transaction failed', 'invoice pending', 'security alert', 'unusual activity',
        'confirm identity', 'restricted access', 'temporarily suspended'
    ];
    const foundKeywords: string[] = [];
    const lowerCaseContent = pageContent.toLowerCase();

    if (pageContent) {
        for (const keyword of suspiciousKeywords) {
            if (lowerCaseContent.includes(keyword)) {
                foundKeywords.push(keyword);
            }
        }
    }

    if (foundKeywords.length > 0) {
        const deductionAmount = Math.min(foundKeywords.length * 5, 30);
        score -= deductionAmount;
        deductions.push(`Suspicious keywords found: ${foundKeywords.join(', ')} (-${deductionAmount})`);
    }

    // --- URL Pattern Analysis ---
    try {
        const urlObj = new URL(originalUrl); // Parse the URL string
        const hostname = urlObj.hostname;
        const path = urlObj.pathname;

        // Rule 1: IP address in hostname (e.g., http://192.168.1.1/login)
        const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/; // Basic IPv4 regex
        if (ipRegex.test(hostname)) {
            score -= 30;
            deductions.push('IP address in hostname (-30)');
        }

        // Rule 2: Excessive subdomains (e.g., mail.google.com.phishingsite.com)
        const dotCount = (hostname.match(/\./g) || []).length;
        if (dotCount > 3) { // More than 3 dots often suspicious (e.g., sub.sub.domain.tld)
            score -= 15;
            deductions.push('Excessive subdomains (-15)');
        }

        // Rule 3: Suspicious TLD (Top-Level Domain) - common for phishing
        const suspiciousTlds = ['.xyz', '.top', '.club', '.online', '.site', '.click', '.info', '.biz', '.win'];
        const tld = '.' + (hostname.split('.').pop() || '').toLowerCase(); // Corrected for robustness
        if (tld && suspiciousTlds.includes(tld)) {
            score -= 10;
            deductions.push(`Suspicious TLD (${tld}) (-10)`);
        }

        // Rule 4: Presence of special characters in hostname (e.g., 'xn--' for punycode, or unusual chars)
        if (hostname.startsWith('xn--')) {
            score -= 25;
            deductions.push('Punycode (IDN Homograph) detected (-25)');
        }

        // Rule 5: Extremely long or random-looking path segments (heuristic)
        const pathSegments = path.split('/').filter(s => s.length > 0);
        const longSegment = pathSegments.find(segment => segment.length > 30 && /[0-9a-zA-Z]{30,}/.test(segment));
        if (longSegment) {
            score -= 10;
            deductions.push('Long/random path segment (-10)');
        }

        // Rule 6: Common phishing keywords in path
        const pathKeywords = ['login', 'signin', 'verify', 'confirm', 'account', 'webscr', 'update', 'secure', 'billing', 'client'];
        if (pathKeywords.some(keyword => path.toLowerCase().includes(keyword))) {
             const baseDomain = hostname.split('.').slice(-2).join('.');
             const highlyTrustedDomains = [
                'google.com', 'microsoft.com', 'apple.com', 'amazon.com', 'paypal.com',
                'facebook.com', 'twitter.com', 'x.com', 'wikipedia.org', 'whoisxmlapi.com'
            ];
             if (!highlyTrustedDomains.includes(baseDomain)) {
                score -= 5;
                deductions.push('Common phishing keyword in path (-5)');
             }
        }


    } catch (urlError) {
        score -= 10;
        deductions.push('Malformed or unparseable URL (-10)');
        console.warn(`[TrustScore] Could not parse URL for pattern analysis: ${originalUrl}`, urlError);
    }
    // --- END URL Pattern Analysis ---


    // --- NEW: IP Reputation Deduction ---
    // Ensure ipReputation is defined and has a non-zero abuseConfidenceScore
    if (ipReputation && ipReputation.abuseConfidenceScore && ipReputation.abuseConfidenceScore > 0) {
        const deductionAmount = Math.min(Math.floor(ipReputation.abuseConfidenceScore / 5), 40); // Max 40 deduction
        score -= deductionAmount;
        deductions.push(`IP flagged with abuse score ${ipReputation.abuseConfidenceScore} (-${deductionAmount})`);
    }
    // isWhitelisted from AbuseIPDB means it's generally safe, so no deduction.

    // --- NEW: DNS Record Deduction ---
    // Only apply for HTTPS domains, as SPF/DMARC are primarily for email authenticity linked to domain,
    // and missing them on HTTP sites is less relevant than missing HTTPS.
    if (originalUrl.startsWith('https://')) {
        if (dnsRecords) { // Ensure dnsRecords object is available
            if (!dnsRecords.hasSPF) {
                score -= 10;
                deductions.push('Missing SPF record (-10)');
            }
            if (!dnsRecords.hasDMARC) {
                score -= 15;
                deductions.push('Missing DMARC record (-15)');
            }
        } else {
            console.warn(`[TrustScore] DNS records data not available for ${originalUrl}, skipping DNS record deductions.`);
        }
        // Add checks for DKIM if implemented
    }


    score = Math.max(0, Math.min(100, score)); // Ensure score is between 0 and 100
    return { score, deductions };
};