const tf = require('@tensorflow/tfjs-node');
const toxicity = require('@tensorflow-models/toxicity');

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
 * Moderate content using toxicity model and scam detection
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
    
    // Combine results
    const isSafe = toxicLabels.length === 0 && !scamResult.isScam;
    const reasons = [...toxicLabels, ...scamResult.reasons];
    
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