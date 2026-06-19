(function () {
  const PROVIDERS = [
    {
      key: 'openrouter',
      label: 'OpenRouter',
      fields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'sk-or-v1-...' },
        { name: 'model', label: 'Model', type: 'text', required: false, placeholder: 'openai/gpt-4o-mini', defaultValue: 'openai/gpt-4o-mini' }
      ],
      docUrl: 'https://openrouter.ai/keys'
    },
    {
      key: 'gemini',
      label: 'Gemini',
      fields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'AIzaSy...' },
        { name: 'model', label: 'Model', type: 'text', required: false, placeholder: 'gemini-2.0-flash', defaultValue: 'gemini-2.0-flash' }
      ],
      docUrl: 'https://aistudio.google.com/app/apikey'
    },
    {
      key: 'openai',
      label: 'OpenAI',
      fields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'sk-proj-...' },
        { name: 'model', label: 'Model', type: 'text', required: false, placeholder: 'gpt-4o-mini', defaultValue: 'gpt-4o-mini' }
      ],
      docUrl: 'https://platform.openai.com/api-keys'
    },
    {
      key: 'nvidia',
      label: 'NVIDIA',
      fields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'nvapi-...' },
        { name: 'model', label: 'Model', type: 'text', required: false, placeholder: 'meta/llama-3.1-8b-instruct', defaultValue: 'meta/llama-3.1-8b-instruct' }
      ],
      docUrl: 'https://build.nvidia.com/'
    },
    {
      key: 'ollama',
      label: 'Ollama (Local)',
      fields: [
        { name: 'apiKey', label: 'API Key (if required)', type: 'password', required: false, placeholder: 'Optional' },
        { name: 'baseUrl', label: 'Base URL', type: 'text', required: false, placeholder: 'http://localhost:11434', defaultValue: 'http://localhost:11434' },
        { name: 'model', label: 'Model', type: 'text', required: false, placeholder: 'llama3.2', defaultValue: 'llama3.2' }
      ],
      docUrl: 'https://ollama.ai/'
    }
  ];

  document.addEventListener('DOMContentLoaded', async () => {
    renderProviders();
    await loadSettings();
    document.getElementById('saveBtn').addEventListener('click', saveSettings);
  });

  function renderProviders() {
    const container = document.getElementById('providerContainers');
    container.innerHTML = '';

    PROVIDERS.forEach(p => {
      const card = document.createElement('div');
      card.className = 'provider-card';
      card.id = `provider-${p.key}`;

      let fieldsHtml = '';
      p.fields.forEach(f => {
        fieldsHtml += `
          <div class="form-group">
            <label for="${p.key}-${f.name}">${f.label}</label>
            <div class="form-row">
              <div class="form-group">
                <input type="${f.type}" id="${p.key}-${f.name}"
                  ${f.required ? 'required' : ''}
                  placeholder="${f.placeholder || ''}"
                  ${f.name === 'apiKey' ? 'autocomplete="off" spellcheck="false"' : ''}>
              </div>
              ${f.name === 'apiKey' ? `
                <button class="btn btn-secondary btn-sm test-btn" data-provider="${p.key}">Test</button>
              ` : ''}
            </div>
          </div>
        `;
      });

      card.innerHTML = `
        <div class="provider-header">
          <span class="provider-name">${p.label}</span>
          <span id="status-${p.key}" class="provider-badge missing">Not configured</span>
        </div>
        ${fieldsHtml}
        <p id="msg-${p.key}" class="message"></p>
        <p><a href="${p.docUrl}" class="doc-link" target="_blank" rel="noopener">Get ${p.label} API Key &rarr;</a></p>
      `;

      container.appendChild(card);

      const testBtn = card.querySelector('.test-btn');
      if (testBtn) {
        testBtn.addEventListener('click', () => testConnection(p.key));
      }
    });
  }

  async function loadSettings() {
    const result = await new Promise(resolve => {
      chrome.storage.local.get(['apiKeys', 'provider', 'model', 'baseUrl'], resolve);
    });

    document.getElementById('defaultProvider').value = result.provider || 'openrouter';
    const apiKeys = result.apiKeys || {};
    const models = result.model || {};
    const baseUrls = result.baseUrl || {};

    PROVIDERS.forEach(p => {
      const keys = apiKeys[p.key] || {};
      p.fields.forEach(f => {
        const el = document.getElementById(`${p.key}-${f.name}`);
        if (!el) return;
        if (f.name === 'apiKey') el.value = keys.apiKey || '';
        else if (f.name === 'model') el.value = models[p.key] || '';
        else if (f.name === 'baseUrl') el.value = baseUrls[p.key] || '';
      });
      updateBadge(p.key, keys.apiKey);
    });
  }

  function updateBadge(key, apiKey) {
    const el = document.getElementById(`status-${key}`);
    if (!el) return;
    if (apiKey && apiKey.length > 0) {
      el.className = 'provider-badge ok';
      el.textContent = 'Connected';
    } else {
      el.className = 'provider-badge missing';
      el.textContent = 'Not configured';
    }
  }

  async function saveSettings() {
    const apiKeys = {};
    const models = {};
    const baseUrls = {};

    PROVIDERS.forEach(p => {
      const data = {};
      p.fields.forEach(f => {
        const el = document.getElementById(`${p.key}-${f.name}`);
        if (!el) return;
        const val = el.value.trim();
        if (f.name === 'apiKey') data.apiKey = val;
        else if (f.name === 'model') models[p.key] = val || f.defaultValue || '';
        else if (f.name === 'baseUrl') baseUrls[p.key] = val || f.defaultValue || 'http://localhost:11434';
      });
      if (data.apiKey) apiKeys[p.key] = data;
    });

    const provider = document.getElementById('defaultProvider').value;
    await new Promise(resolve => chrome.storage.local.set({ apiKeys, provider, model: models, baseUrl: baseUrls }, resolve));

    PROVIDERS.forEach(p => {
      const keys = apiKeys[p.key] || {};
      updateBadge(p.key, keys.apiKey);
    });

    showGlobal('Settings saved.', 'ok');
  }

  async function testConnection(providerKey) {
    const apiKeyEl = document.getElementById(`${providerKey}-apiKey`);
    const modelEl = document.getElementById(`${providerKey}-model`);
    const baseUrlEl = document.getElementById(`${providerKey}-baseUrl`);
    const msgEl = document.getElementById(`msg-${providerKey}`);
    const btn = document.querySelector(`.test-btn[data-provider="${providerKey}"]`);

    const apiKey = apiKeyEl?.value?.trim() || '';
    const model = modelEl?.value?.trim() || undefined;
    const baseUrl = baseUrlEl?.value?.trim() || undefined;

    if (!apiKey && providerKey !== 'ollama') {
      msgEl.className = 'message err';
      msgEl.textContent = 'Enter an API key first.';
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-sm"></span>';
    msgEl.className = 'message info';
    msgEl.textContent = 'Testing...';

    try {
      const result = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'testConnection',
          provider: providerKey,
          apiKey,
          model,
          baseUrl
        }, r => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else if (r?.error) reject(new Error(r.error));
          else resolve(r?.result || '');
        });
      });
      msgEl.className = 'message ok';
      const snippet = result.length > 120 ? result.substring(0, 120) + '...' : result;
      msgEl.textContent = 'OK: ' + snippet;
    } catch (err) {
      msgEl.className = 'message err';
      msgEl.textContent = 'Failed: ' + err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Test';
    }
  }

  function showGlobal(text, type) {
    const el = document.getElementById('globalMessage');
    el.className = 'msg-global ' + (type || '');
    el.textContent = text;
    setTimeout(() => { el.textContent = ''; }, 3000);
  }
})();
