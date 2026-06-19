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

  let statusElems = {};

  document.addEventListener('DOMContentLoaded', async () => {
    renderProviderSections();
    await loadSettings();
    document.getElementById('saveBtn').addEventListener('click', saveSettings);
  });

  function renderProviderSections() {
    const container = document.getElementById('providerContainers');
    container.innerHTML = '';

    PROVIDERS.forEach(prov => {
      const section = document.createElement('div');
      section.className = 'provider-section';
      section.id = `provider-${prov.key}`;

      let fieldsHtml = '';
      prov.fields.forEach(field => {
        fieldsHtml += `
          <div class="form-group">
            <label for="${prov.key}-${field.name}">${field.label}</label>
            <div class="form-row">
              <div class="form-group">
                <input type="${field.type}" id="${prov.key}-${field.name}"
                  ${field.required ? 'required' : ''}
                  placeholder="${field.placeholder || ''}"
                  ${field.name === 'apiKey' ? 'autocomplete="off" spellcheck="false"' : ''}>
              </div>
              ${field.name === 'apiKey' ? `
                <button class="btn btn-secondary btn-sm test-btn" data-provider="${prov.key}">Test</button>
              ` : ''}
            </div>
          </div>
        `;
      });

      section.innerHTML = `
        <div class="provider-header">
          <span class="provider-name">${prov.label}</span>
          <span id="status-${prov.key}" class="provider-status disconnected">Not configured</span>
        </div>
        ${fieldsHtml}
        <p id="msg-${prov.key}" class="message"></p>
        <p class="test-result">
          <a href="${prov.docUrl}" target="_blank" rel="noopener" style="color:#90caf9;font-size:12px;">
            Get ${prov.label} API Key &rarr;
          </a>
        </p>
      `;

      container.appendChild(section);

      const testBtn = section.querySelector('.test-btn');
      if (testBtn) {
        testBtn.addEventListener('click', () => testConnection(prov.key));
      }
    });
  }

  async function loadSettings() {
    const result = await new Promise(resolve => {
      chrome.storage.local.get(['apiKeys', 'provider', 'model', 'baseUrl'], resolve);
    });

    const apiKeys = result.apiKeys || {};
    const provider = result.provider || 'openrouter';
    const models = result.model || {};
    const baseUrls = result.baseUrl || {};

    document.getElementById('defaultProvider').value = provider;

    PROVIDERS.forEach(prov => {
      const key = prov.key;
      const providerKeys = apiKeys[key] || {};

      prov.fields.forEach(field => {
        const el = document.getElementById(`${key}-${field.name}`);
        if (!el) return;

        if (field.name === 'apiKey') {
          el.value = providerKeys.apiKey || '';
        } else if (field.name === 'model') {
          el.value = models[key] || '';
        } else if (field.name === 'baseUrl') {
          el.value = baseUrls[key] || '';
        }
      });

      updateProviderStatus(key, providerKeys.apiKey);
    });
  }

  async function saveSettings() {
    const apiKeys = {};
    const models = {};
    const baseUrls = {};
    let allValid = true;

    PROVIDERS.forEach(prov => {
      const key = prov.key;
      const providerData = {};

      prov.fields.forEach(field => {
        const el = document.getElementById(`${key}-${field.name}`);
        if (!el) return;

        const val = el.value.trim();

        if (field.name === 'apiKey') {
          if (field.required && !val && key !== 'ollama') {
            allValid = false;
          }
          providerData.apiKey = val || '';
        } else if (field.name === 'model') {
          models[key] = val || field.defaultValue || '';
        } else if (field.name === 'baseUrl') {
          baseUrls[key] = val || field.defaultValue || 'http://localhost:11434';
        }
      });

      if (providerData.apiKey) {
        apiKeys[key] = providerData;
      }
    });

    const provider = document.getElementById('defaultProvider').value;

    await new Promise(resolve => {
      chrome.storage.local.set({ apiKeys, provider, model: models, baseUrl: baseUrls }, resolve);
    });

    PROVIDERS.forEach(prov => {
      const key = prov.key;
      const keys = apiKeys[key] || {};
      updateProviderStatus(key, keys.apiKey);
    });

    showGlobalMessage('Settings saved successfully!', 'success');
  }

  function updateProviderStatus(key, apiKey) {
    const el = document.getElementById(`status-${key}`);
    if (!el) return;
    if (apiKey && apiKey.length > 0) {
      el.className = 'provider-status connected';
      el.textContent = 'Connected';
    } else {
      el.className = 'provider-status disconnected';
      el.textContent = 'Not configured';
    }
  }

  async function testConnection(providerKey) {
    const apiKeyEl = document.getElementById(`${providerKey}-apiKey`);
    const modelEl = document.getElementById(`${providerKey}-model`);
    const baseUrlEl = document.getElementById(`${providerKey}-baseUrl`);
    const msgEl = document.getElementById(`msg-${providerKey}`);
    const testBtn = document.querySelector(`.test-btn[data-provider="${providerKey}"]`);

    const apiKey = apiKeyEl?.value?.trim() || '';
    const model = modelEl?.value?.trim() || undefined;
    const baseUrl = baseUrlEl?.value?.trim() || undefined;

    if (!apiKey && providerKey !== 'ollama') {
      msgEl.className = 'message error';
      msgEl.textContent = 'Please enter an API key first.';
      return;
    }

    testBtn.disabled = true;
    testBtn.innerHTML = '<span class="spinner-sm"></span>';
    msgEl.className = 'message info';
    msgEl.textContent = 'Testing connection...';

    try {
      const result = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'testConnection',
          provider: providerKey,
          apiKey,
          model,
          baseUrl
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response?.result || '');
          }
        });
      });
      msgEl.className = 'message success';
      msgEl.textContent = `Connected! Response: "${result.substring(0, 100)}${result.length > 100 ? '...' : ''}"`;
    } catch (err) {
      msgEl.className = 'message error';
      msgEl.textContent = `Connection failed: ${err.message}`;
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = 'Test';
    }
  }

  function showGlobalMessage(text, type) {
    const el = document.getElementById('globalMessage');
    el.className = `message ${type}`;
    el.textContent = text;
    setTimeout(() => { el.textContent = ''; }, 3000);
  }
})();
