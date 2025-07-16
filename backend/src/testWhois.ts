import { getDomainInfo } from './integrations/whois';

(async () => {
  const domain = 'example.com';
  const info = await getDomainInfo(domain);
  console.log(info);
})();

// npx ts-node src/testWhois.ts