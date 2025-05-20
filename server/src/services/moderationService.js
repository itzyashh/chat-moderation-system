const tf = require('@tensorflow/tfjs-node');
const toxicity = require('@tensorflow-models/toxicity');
const axios = require('axios');

let toxicityModel = null;

// Labels we want to detect
const TOXICITY_THRESHOLD = 0.9;
const TOXICITY_LABELS = [
  'identity_attack',
  'insult',
  'obscene',
  'severe_toxicity',
  'sexual_explicit',
  'threat',
  'toxicity'
];

// Scam and fraud patterns
const SCAM_PATTERNS = [
  /\b(?:bitcoin|crypto|eth|wallet|invest)\b.*?\b(?:send|transfer|urgent|profit|double|guaranteed)\b/i,
  /\b(?:account|password|login|verify|urgent|suspended)\b.*?\b(?:click|link|confirm|verify|update)\b/i,
  /\b(?:gift card|steam card|itunes card|google play)\b.*?\b(?:need|send|buy|urgent)\b/i,
  /\b(?:money transfer|western union|moneygram|wire transfer)\b.*?\b(?:urgent|help|send)\b/i,
  /\b(?:lottery|winner|won|prize|claim)\b.*?\b(?:fee|tax|deposit|payment)\b/i,
  /\b(?:whatsapp|telegram|signal)\b.*?\b(?:contact|message|private|continue)\b/i
];


const SAFE_BROWSING_API_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

// Initialize the toxicity model
const loadModel = async () => {
  if (!toxicityModel) {
    console.log('Loading toxicity model...');
    toxicityModel = await toxicity.load(TOXICITY_THRESHOLD, TOXICITY_LABELS);
    console.log('Toxicity model loaded');
  }
  return toxicityModel;
};

// Load model on startup
loadModel().catch(err => console.error('Error loading toxicity model:', err));

/**
 * Check text for scam/fraud patterns
 * @param {string} text - Text to analyze
 * @returns {Object} - Results of scam detection
 */
const detectScam = (text) => {
  const scamResults = [];
  
  for (const pattern of SCAM_PATTERNS) {
    if (pattern.test(text)) {
      scamResults.push('Potential scam or fraud message');
      break;
    }
  }
  
  return {
    isScam: scamResults.length > 0,
    reasons: scamResults
  };
};

/**
 * Check URLs in text using Google Safe Browsing API
 * @param {string} text
 * @returns {Promise<{unsafe: boolean, reasons: string[]}>}
 */
const checkUrlsForSafety = async (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex);
  if (!urls || !process.env.GOOGLE_SAFE_BROWSING_API_KEY) return { unsafe: false, reasons: [] };

  for (const url of urls) {
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
    try {
      const response = await axios.post(
        `${SAFE_BROWSING_API_URL}?key=${process.env.GOOGLE_SAFE_BROWSING_API_KEY}`,
        payload
      );
      if (response.data && response.data.matches) {
        const threat = response.data.matches[0];
        return {
          unsafe: true,
          reasons: [`Unsafe link detected (${threat.threatType})`]
        };
      }
    } catch (error) {
      console.error('Error checking URL safety:', error);
      return { unsafe: true, reasons: ['Error checking link safety'] };
    }
  }
  return { unsafe: false, reasons: [] };
};

/**
 * Moderate content using toxicity model, scam detection, and Safe Browsing
 * @param {string} text - Text to moderate
 * @returns {Object} - Moderation results
 */
const moderateContent = async (text) => {
  try {
    // Make sure the model is loaded
    const model = await loadModel();
    
    // Get toxicity predictions
    const predictions = await model.classify(text);
    
    const toxicLabels = [];
    predictions.forEach(prediction => {
      // If any match is found (prediction.results[0].match === true)
      if (prediction.results[0]?.match) {
        toxicLabels.push(prediction.label);
      }
    });
    
    // Check for scams
    const scamResult = detectScam(text);

    // Check for unsafe URLs
    console.log('Checking URLs for safety...', text);
    const urlSafety = await checkUrlsForSafety(text);

    // Combine results
    const isSafe = toxicLabels.length === 0 && !scamResult.isScam && !urlSafety.unsafe;
    const reasons = [...toxicLabels, ...scamResult.reasons, ...urlSafety.reasons];
    
    return {
      isSafe,
      reasons: reasons.length > 0 ? reasons : [],
      toxicityResults: predictions,
      scamResults: scamResult
    };
  } catch (error) {
    console.error('Error moderating content:', error);
    return {
      isSafe: true, // Default to allowing messages if the model fails
      error: error.message,
      reasons: ['Error analyzing message']
    };
  }
};

module.exports = {
  moderateContent,
  loadModel
}; 