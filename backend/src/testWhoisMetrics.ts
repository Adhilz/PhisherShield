// filepath: c:\Users\adhil\Desktop\PhisherShield\phishing-detector-extension\backend\src\testWhoisMetrics.ts
import { getDomainInfo, extractWhoisMetrics } from './integrations/whois';

(async () => {
    const domain = 'example.com';
    const whoisData = await getDomainInfo(domain);
    const metrics = extractWhoisMetrics(whoisData);
    console.log(metrics);
})();