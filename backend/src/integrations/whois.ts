import axios from 'axios';

const WHOIS_API_URL = 'https://www.whoisxmlapi.com/whoisserver/WhoisService';
const WHOIS_API_KEY = 'at_NuqQOnLYvpvMrB18nMXchoKOZtGSn';

export const getDomainInfo = async (domain: string) => {
    try {
        const response = await axios.get(`${WHOIS_API_URL}?apiKey=${WHOIS_API_KEY}&domainName=${domain}&outputFormat=JSON`);
        return response.data;
    } catch (error) {
        console.error('Error fetching WHOIS data:', error);
        throw new Error('Failed to fetch WHOIS data');
    }
};
export const extractWhoisMetrics = (whoisData: any) => {
    const record = whoisData.WhoisRecord || {};
    return {
        domainName: record.domainName,
        registrarName: record.registrarName,
        createdDate: record.createdDateNormalized || record.createdDate,
        expiresDate: record.expiresDateNormalized || record.expiresDate,
        estimatedDomainAge: record.estimatedDomainAge,
    };
};