(function () {
  const PROVIDER_LABELS = {
    openrouter: 'OpenRouter',
    gemini: 'Gemini',
    openai: 'OpenAI',
    nvidia: 'NVIDIA',
    ollama: 'Ollama (Local)'
  };

  document.addEventListener('DOMContentLoaded', async () => {
    const select = document.getElementById('providerSelect');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    const result = await new Promise(resolve => {
      chrome.storage.local.get(['provider', 'apiKeys'], resolve);
    });

    const currentProvider = result.provider || 'openrouter';
    const apiKeys = result.apiKeys || {};
    const hasKey = !!(apiKeys[currentProvider]?.apiKey);

    select.value = currentProvider;
    updateStatus(currentProvider, hasKey);

    select.addEventListener('change', async () => {
      const newProvider = select.value;
      await new Promise(resolve => {
        chrome.storage.local.set({ provider: newProvider }, resolve);
      });

      const newApiKeys = await new Promise(resolve => {
        chrome.storage.local.get('apiKeys', resolve);
      });
      const hasKey = !!(newApiKeys.apiKeys?.[newProvider]?.apiKey);
      updateStatus(newProvider, hasKey);
    });

    document.getElementById('openOptionsBtn').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  });

  function updateStatus(provider, hasKey) {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    const label = PROVIDER_LABELS[provider] || provider;

    if (hasKey) {
      dot.className = 'status-dot connected';
      text.textContent = `${label}: API key configured`;
    } else {
      dot.className = 'status-dot disconnected';
      text.textContent = `${label}: No API key set`;
    }
  }
})();
