import axios from 'axios';

const PHISHTANK_API_URL = 'https://checkurl.phishtank.com/checkurl/';
const PHISHTANK_API_KEY = ''; // Leave blank if you don't have an API key

export const checkUrlWithPhishTank = async (url: string): Promise<boolean> => {
    if (!PHISHTANK_API_KEY) {
        console.warn('PhishTank API key not set. Skipping PhishTank check.');
        return false; // Or undefined, or a special value
    }
    try {
        const response = await axios.post(PHISHTANK_API_URL, {
            url,
            app_key: PHISHTANK_API_KEY,
        });

        if (response.data && response.data.results) {
            return response.data.results.in_database;
        }
    } catch (error) {
        console.error('Error checking URL with PhishTank:', error);
    }
    return false;
};

export const reportPhishingUrl = async (url: string, email: string): Promise<boolean> => {
    if (!PHISHTANK_API_KEY) {
        console.warn('PhishTank API key not set. Skipping PhishTank reporting.');
        return false;
    }
    try {
        const response = await axios.post('https://phishtank.com/api/report', {
            url,
            email,
            app_key: PHISHTANK_API_KEY,
        });

        return response.data && response.data.success;
    } catch (error) {
        console.error('Error reporting phishing URL to PhishTank:', error);
    }
    return false;
};