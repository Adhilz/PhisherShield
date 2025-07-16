import { checkUrlWithGoogleSafeBrowsing } from './integrations/googleSafeBrowsing';

(async () => {
    const url = 'http://testsafebrowsing.appspot.com/s/malware.html'; // Use full URL
    const result = await checkUrlWithGoogleSafeBrowsing(url);
    console.log('Google Safe Browsing result:', result);
})();