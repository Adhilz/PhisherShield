type WhoisMetrics = {
    domainName?: string;
    registrarName?: string;
    createdDate?: string;
    expiresDate?: string;
    estimatedDomainAge?: number;
};

type TrustScoreResult = {
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

    // Google Safe Browsing deduction
    if (gsbResult && gsbResult.matches && gsbResult.matches.length > 0) {
        score -= 50;
        deductions.push('Flagged by Google Safe Browsing (-50)');
    }

    score = Math.max(0, Math.min(100, score));
    return { score, deductions };
};

export const calculateTrustScoreWithGSBAndSSL = (
    whois: WhoisMetrics,
    gsbResult: any,
    sslValid: boolean
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

    // Google Safe Browsing deduction
    if (gsbResult && gsbResult.matches && gsbResult.matches.length > 0) {
        score -= 50;
        deductions.push('Flagged by Google Safe Browsing (-50)');
    }

    // SSL deduction
    if (!sslValid) {
        score -= 20;
        deductions.push('SSL certificate missing or invalid (-20)');
    }

    score = Math.max(0, Math.min(100, score));
    return { score, deductions };
};