import { getDomainInfo, extractWhoisMetrics } from './integrations/whois';
import { checkUrlWithGoogleSafeBrowsing } from './integrations/googleSafeBrowsing';
import { checkSSLValidity } from './utils/sslCheck';
import { calculateTrustScoreWithGSBAndSSL } from './utils/trustScore';

(async () => {
    const domain = 'expired.badssl.com';
    const url = 'http://testsafebrowsing.appspot.com/s/malware.html'; // Use full URL for Google Safe Browsing check

    const whoisData = await getDomainInfo(domain);
    const metrics = extractWhoisMetrics(whoisData);
    const gsbResult = await checkUrlWithGoogleSafeBrowsing(url);
    const sslValid = await checkSSLValidity(domain);

    const result = calculateTrustScoreWithGSBAndSSL(metrics, gsbResult, sslValid);
    console.log(`Trust Score for ${domain}:`, result.score);
    if (result.deductions.length) {
        console.log('Deductions:');
        result.deductions.forEach(d => console.log('-', d));
    } else {
        console.log('No deductions. Domain appears safe by WHOIS, Google Safe Browsing, and SSL.');
    }
})();