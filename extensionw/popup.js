/**
 * Popup script for GhostTyper extension
 * 
 * Handles UI interactions in the popup and communicates with the background script
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const enableToggle = document.getElementById('enable-toggle');
  const tonePreference = document.getElementById('tone-preference');
  const suggestionDelay = document.getElementById('suggestion-delay');
  const delayValue = document.getElementById('delay-value');
  const sampleText = document.getElementById('sample-text');
  const uploadSampleBtn = document.getElementById('upload-sample');
  const fileUpload = document.getElementById('file-upload');
  const clearDataBtn = document.getElementById('clear-data');
  const uploadStatus = document.getElementById('upload-status');
  
  // Load settings from storage
  loadSettings();
  
  // Event listeners
  enableToggle.addEventListener('change', saveSettings);
  tonePreference.addEventListener('change', saveSettings);
  suggestionDelay.addEventListener('input', updateDelayValue);
  suggestionDelay.addEventListener('change', saveSettings);
  uploadSampleBtn.addEventListener('click', uploadSample);
  fileUpload.addEventListener('change', handleFileUpload);
  clearDataBtn.addEventListener('click', clearData);
  
  /**
   * Load settings from browser storage
   */
  async function loadSettings() {
    try {
      const storage = await browser.storage.local.get('ghosttyper_settings');
      const settings = storage.ghosttyper_settings || ENV.DEFAULT_SETTINGS;
      
      enableToggle.checked = settings.enabled;
      tonePreference.value = settings.tonePreference || 'auto';
      suggestionDelay.value = settings.suggestionDelay || 300;
      delayValue.textContent = suggestionDelay.value;
    } catch (error) {
      console.error('Error loading settings:', error);
      showStatus('Error loading settings', 'error');
    }
  }
  
  /**
   * Save settings to browser storage
   */
  async function saveSettings() {
    try {
      const settings = {
        enabled: enableToggle.checked,
        tonePreference: tonePreference.value,
        suggestionDelay: parseInt(suggestionDelay.value, 10)
      };
      
      await browser.storage.local.set({ ghosttyper_settings: settings });
      
      // Notify content script that settings have been updated
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        browser.tabs.sendMessage(tabs[0].id, { action: 'settingsUpdated' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showStatus('Error saving settings', 'error');
    }
  }
  
  /**
   * Update the delay value display
   */
  function updateDelayValue() {
    delayValue.textContent = suggestionDelay.value;
  }
  
  /**
   * Upload a writing sample from the textarea
   */
  async function uploadSample() {
    const text = sampleText.value.trim();
    
    if (!text) {
      showStatus('Please enter a writing sample', 'error');
      return;
    }
    
    try {
      showStatus('Uploading sample...', 'info');
      
      const response = await fetch(`${ENV.API_BASE_URL}${ENV.ENDPOINTS.SAMPLE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.userToneId) {
        await browser.storage.local.set({ userToneId: data.userToneId });
        showStatus('Writing sample uploaded successfully!', 'success');
        sampleText.value = '';
      } else {
        throw new Error('Failed to process writing sample');
      }
    } catch (error) {
      console.error('Error uploading sample:', error);
      showStatus('Error uploading sample', 'error');
    }
  }
  
  /**
   * Handle file upload for writing samples
   * @param {Event} event - The change event
   */
  async function handleFileUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    if (file.type !== 'text/plain') {
      showStatus('Please upload a .txt file', 'error');
      return;
    }
    
    try {
      showStatus('Reading file...', 'info');
      
      const text = await readFile(file);
      
      if (!text.trim()) {
        showStatus('File is empty', 'error');
        return;
      }
      
      sampleText.value = text;
      uploadSample();
    } catch (error) {
      console.error('Error reading file:', error);
      showStatus('Error reading file', 'error');
    }
  }
  
  /**
   * Read a file as text
   * @param {File} file - The file to read
   * @returns {Promise<string>} - The file contents
   */
  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsText(file);
    });
  }
  
  /**
   * Clear all stored data
   */
  async function clearData() {
    if (!confirm('Are you sure you want to clear all your stored data? This cannot be undone.')) {
      return;
    }
    
    try {
      await browser.storage.local.remove(['userToneId']);
      showStatus('Data cleared successfully', 'success');
    } catch (error) {
      console.error('Error clearing data:', error);
      showStatus('Error clearing data', 'error');
    }
  }
  
  /**
   * Show a status message
   * @param {string} message - The message to show
   * @param {string} type - The type of message ('success', 'error', 'info')
   */
  function showStatus(message, type) {
    uploadStatus.textContent = message;
    uploadStatus.className = 'status-message';
    uploadStatus.classList.add(type);
    
    // Clear the message after 5 seconds for success messages
    if (type === 'success') {
      setTimeout(() => {
        uploadStatus.style.display = 'none';
      }, 5000);
    }
  }
});
