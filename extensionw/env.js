/**
 * Environment configuration for GhostTyper extension
 */
const ENV = {
  // API base URL - change this to your production API URL when deploying
  // API_BASE_URL: 'http://localhost:3000',
  API_BASE_URL: 'https://ghosttyper-keyboard-ghostwriter.onrender.com', // Production URL
  // Endpoints
  ENDPOINTS: {
    GENERATE: '/generate',
    SAMPLE: '/sample',
    USER_TONE: '/user-tone'
  },

  // Debounce delay for API calls (in milliseconds)
  DEBOUNCE_DELAY: 300,

  // Default settings
  DEFAULT_SETTINGS: {
    enabled: true,
    tonePreference: 'auto', // 'auto', 'casual', 'professional', etc.
    suggestionDelay: 300
  }
};

// Prevent modifications to the ENV object
Object.freeze(ENV);
Object.freeze(ENV.ENDPOINTS);
Object.freeze(ENV.DEFAULT_SETTINGS);
