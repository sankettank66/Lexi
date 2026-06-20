console.log('[Lexi] service worker started');

importScripts(
  'src/lib/utils.js',
  'src/lib/providers/base.js',
  'src/lib/providers/openrouter.js',
  'src/lib/providers/gemini.js',
  'src/lib/providers/openai.js',
  'src/lib/providers/nvidia.js',
  'src/lib/providers/ollama.js',
  'src/lib/api.js'
);

(function () {
  const MENU_IDS = {
    SEPARATOR: 'lexi-separator',
    FIX: 'fix',
    REWRITE: 'rewrite'
  };

  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      chrome.storage.local.set(Utils.getDefaultSettings());
    }
    createContextMenus();
  });

  chrome.runtime.onStartup.addListener(createContextMenus);

  function createContextMenus() {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'lexi-parent',
        title: 'Lexi',
        contexts: ['selection']
      });

      chrome.contextMenus.create({
        id: MENU_IDS.FIX,
        parentId: 'lexi-parent',
        title: 'Fix',
        contexts: ['selection']
      });

      chrome.contextMenus.create({
        id: MENU_IDS.REWRITE,
        parentId: 'lexi-parent',
        title: 'Rewrite',
        contexts: ['selection']
      });
    });
  }

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const text = Utils.sanitizeText(info.selectionText);
    if (!text) return;

    const action = info.menuItemId;
    if (action !== MENU_IDS.FIX && action !== MENU_IDS.REWRITE) return;

    try {
      const settings = await Utils.getSettings();
      const provider = settings.provider || 'openrouter';
      const apiKeys = settings.apiKeys || {};
      const providerKeys = apiKeys[provider] || {};
      const apiKey = providerKeys.apiKey || '';
      const model = (settings.model || {})[provider];
      const extraConfig = {};
      const baseUrls = settings.baseUrl || {};
      if (baseUrls[provider]) extraConfig.baseUrl = baseUrls[provider];

      if (!apiKey && provider !== 'ollama') {
        await sendToContent(tab.id, {
          action: 'showError',
          message: `No API key configured for ${provider}. Please add one in extension settings.`
        });
        return;
      }

      await sendToContent(tab.id, { action: 'saveSelection' });
      await sendToContent(tab.id, { action: 'showLoading' });

      const result = await AIAPI.callAI(provider, action, text, apiKey, model, extraConfig);

      await sendToContent(tab.id, {
        action: 'showResult',
        original: text,
        corrected: result,
        menuItemId: action
      });
    } catch (err) {
      await sendToContent(tab.id, {
        action: 'showError',
        message: err.message || 'An unexpected error occurred.'
      });
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'tryAgain') {
      handleRetry(sender.tab?.id, message.text, message.menuItemId);
      sendResponse({ ok: true });
      return true;
    }

    if (message.action === 'openOptions') {
      chrome.runtime.openOptionsPage();
      sendResponse({ ok: true });
      return true;
    }

    if (message.action === 'testConnection') {
      testProviderConnection(message)
        .then(result => sendResponse({ result }))
        .catch(err => sendResponse({ error: err.message }));
      return true;
    }

    if (message.action === 'processText') {
      processText(message.text, message.menuItemId)
        .then(result => sendResponse({ result }))
        .catch(err => sendResponse({ error: err.message }));
      return true;
    }
  });

  async function processText(text, menuItemId) {
    console.log('[Lexi] processText:', menuItemId, 'text:', text);
    if (!text || !menuItemId) throw new Error('Missing text or action');

    const settings = await Utils.getSettings();
    const provider = settings.provider || 'openrouter';
    const apiKeys = settings.apiKeys || {};
    const providerKeys = apiKeys[provider] || {};
    const apiKey = providerKeys.apiKey || '';
    const model = (settings.model || {})[provider];
    const extraConfig = {};
    const baseUrls = settings.baseUrl || {};
    if (baseUrls[provider]) extraConfig.baseUrl = baseUrls[provider];

    if (!apiKey && provider !== 'ollama') {
      throw new Error(`No API key configured for ${provider}. Please add one in extension settings.`);
    }

    return AIAPI.callAI(provider, menuItemId, text, apiKey, model, extraConfig);
  }

  async function testProviderConnection(msg) {
    const extraConfig = {};
    if (msg.baseUrl) extraConfig.baseUrl = msg.baseUrl;

    const provider = AIAPI.createProvider(
      msg.provider,
      msg.apiKey || '',
      msg.model || undefined,
      extraConfig
    );

    return provider.testConnection();
  }

  async function handleRetry(tabId, text, menuItemId) {
    if (!tabId || !text || !menuItemId) return;

    try {
      const settings = await Utils.getSettings();
      const provider = settings.provider || 'openrouter';
      const apiKeys = settings.apiKeys || {};
      const providerKeys = apiKeys[provider] || {};
      const apiKey = providerKeys.apiKey || '';
      const model = (settings.model || {})[provider];
      const extraConfig = {};
      const baseUrls = settings.baseUrl || {};
      if (baseUrls[provider]) extraConfig.baseUrl = baseUrls[provider];

      if (!apiKey && provider !== 'ollama') {
        await sendToContent(tabId, {
          action: 'showError',
          message: `No API key configured for ${provider}.`
        });
        return;
      }

      await sendToContent(tabId, { action: 'showLoading' });

      const result = await AIAPI.callAI(provider, menuItemId, text, apiKey, model, extraConfig);

      await sendToContent(tabId, {
        action: 'showResult',
        original: text,
        corrected: result,
        menuItemId
      });
    } catch (err) {
      await sendToContent(tabId, {
        action: 'showError',
        message: err.message || 'Retry failed.'
      });
    }
  }

  async function sendToContent(tabId, message) {
    try {
      await chrome.tabs.sendMessage(tabId, message);
    } catch {
      console.warn('Content script not reachable on tab', tabId);
    }
  }
})();
