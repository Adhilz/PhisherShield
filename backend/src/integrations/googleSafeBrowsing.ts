import axios from 'axios';

const GOOGLE_SAFE_BROWSING_API_KEY = 'YOUR_GOOGLE_SAFE_BROWSING_KEY';
const GOOGLE_SAFE_BROWSING_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

export const checkUrlWithGoogleSafeBrowsing = async (url: string) => {
    const requestBody = {
        client: {
            clientId: 'your-client-id',
            clientVersion: '1.0',
        },
        threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }],
        },
    };

    try {
        const response = await axios.post(`${GOOGLE_SAFE_BROWSING_URL}?key=${GOOGLE_SAFE_BROWSING_API_KEY}`, requestBody);
        return response.data;
    } catch (error) {
        console.error('Error checking URL with Google Safe Browsing:', error);
        throw new Error('Failed to check URL with Google Safe Browsing');
    }
};
