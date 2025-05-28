import axios from 'axios';

const GOOGLE_SAFE_BROWSING_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_SAFE_BROWSING_API_KEY;
const API_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

interface ThreatMatch {
  threatType: string;
  platformType: string;
  threat: {
    url: string;
  };
  cacheDuration: string;
}

export const checkUrlSafety = async (url: string): Promise<{ isSafe: boolean; threatType?: string }> => {
  try {
    const payload = {
      client: {
        clientId: 'chat-moderation-system',
        clientVersion: '1.0.0',
      },
      threatInfo: {
        threatTypes: [
          'MALWARE',
          'SOCIAL_ENGINEERING',
          'UNWANTED_SOFTWARE',
          'POTENTIALLY_HARMFUL_APPLICATION',
        ],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url }],
      },
    };

    const response = await axios.post(
      `${API_URL}?key=${GOOGLE_SAFE_BROWSING_API_KEY}`,
      payload
    );
    console.log('Safe browsing response:', response);
    if (response.data && response.data.matches) {
      const threat = response.data.matches[0] as ThreatMatch;
      return {
        isSafe: false,
        threatType: threat.threatType,
      };
    }

    return { isSafe: true };
  } catch (error) {
    console.error('Error checking URL safety:', error);
    // If there's an error, we'll consider the URL unsafe to be cautious
    return { isSafe: false, threatType: 'UNKNOWN' };
  }
}; 