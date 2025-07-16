import { getDomainInfo, extractWhoisMetrics } from '../integrations/whois';
import { checkUrlWithGoogleSafeBrowsing } from '../integrations/googleSafeBrowsing';
import { checkSSLValidity } from '../utils/sslCheck';
import { calculateTrustScoreWithGSBAndSSL } from '../utils/trustScore';

import { Request, Response } from 'express';

export const scanUrlController = async (req: Request, res: Response) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const domain = new URL(url).hostname;

    try {
        const whoisData = await getDomainInfo(domain);
        const metrics = extractWhoisMetrics(whoisData);
        const gsbResult = await checkUrlWithGoogleSafeBrowsing(url);
        const sslValid = await checkSSLValidity(domain);

        const result = calculateTrustScoreWithGSBAndSSL(metrics, gsbResult, sslValid);
        res.json({ domain, url, ...result });
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: errMsg });
    }
};