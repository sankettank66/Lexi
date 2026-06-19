(function () {
  const STORAGE_KEYS = {
    API_KEYS: 'apiKeys',
    PROVIDER: 'provider',
    MODEL: 'model',
    BASE_URL: 'baseUrl',
    THEME: 'theme'
  };

  function getDefaultSettings() {
    return {
      [STORAGE_KEYS.PROVIDER]: 'openrouter',
      [STORAGE_KEYS.MODEL]: {},
      [STORAGE_KEYS.BASE_URL]: {},
      [STORAGE_KEYS.API_KEYS]: {},
      [STORAGE_KEYS.THEME]: 'dark'
    };
  }

  async function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        [STORAGE_KEYS.PROVIDER, STORAGE_KEYS.MODEL, STORAGE_KEYS.BASE_URL, STORAGE_KEYS.API_KEYS, STORAGE_KEYS.THEME],
        (result) => {
          resolve({ ...getDefaultSettings(), ...result });
        }
      );
    });
  }

  async function saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.local.set(settings, resolve);
    });
  }

  function sanitizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text.trim();
  }

  async function getActiveTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0] || null);
      });
    });
  }

  self.Utils = {
    STORAGE_KEYS,
    getDefaultSettings,
    getSettings,
    saveSettings,
    sanitizeText,
    getActiveTab
  };
})();
