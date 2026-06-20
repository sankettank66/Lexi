(function () {
  const FALLBACK_MODELS = {
    openrouter: [
      'openai/gpt-4o-mini', 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet',
      'google/gemini-2.0-flash', 'mistralai/mixtral-8x22b-instruct'
    ],
    gemini: [
      'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-8b'
    ],
    openai: [
      'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'
    ],
    nvidia: [
      'meta/llama-3.1-8b-instruct', 'meta/llama-3.1-70b-instruct',
      'mistralai/mixtral-8x22b-instruct', 'nvidia/nemotron-4-340b-instruct'
    ],
    ollama: [
      'llama3.2', 'llama3.1', 'mistral', 'phi3', 'mixtral', 'codellama'
    ]
  };

  const PROVIDERS = [
    {
      key: 'openrouter',
      label: 'OpenRouter',
      fields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'sk-or-v1-...' },
        { name: 'model', label: 'Model', type: 'select', required: false },
        { name: 'maxTokens', label: 'Max Tokens', type: 'number', defaultValue: 2048 }
      ],
      docUrl: 'https://openrouter.ai/keys'
    },
    {
      key: 'gemini',
      label: 'Gemini',
      fields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'AIzaSy...' },
        { name: 'model', label: 'Model', type: 'select', required: false },
        { name: 'maxTokens', label: 'Max Tokens', type: 'number', defaultValue: 2048 }
      ],
      docUrl: 'https://aistudio.google.com/app/apikey'
    },
    {
      key: 'openai',
      label: 'OpenAI',
      fields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'sk-proj-...' },
        { name: 'model', label: 'Model', type: 'select', required: false },
        { name: 'maxTokens', label: 'Max Tokens', type: 'number', defaultValue: 2048 }
      ],
      docUrl: 'https://platform.openai.com/api-keys'
    },
    {
      key: 'nvidia',
      label: 'NVIDIA',
      fields: [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'nvapi-...' },
        { name: 'model', label: 'Model', type: 'select', required: false },
        { name: 'maxTokens', label: 'Max Tokens', type: 'number', defaultValue: 2048 }
      ],
      docUrl: 'https://build.nvidia.com/'
    },
    {
      key: 'ollama',
      label: 'Ollama (Local)',
      fields: [
        { name: 'apiKey', label: 'API Key (if required)', type: 'password', required: false, placeholder: 'Optional' },
        { name: 'baseUrl', label: 'Base URL', type: 'text', required: false, placeholder: 'http://localhost:11434', defaultValue: 'http://localhost:11434' },
        { name: 'model', label: 'Model', type: 'select', required: false },
        { name: 'maxTokens', label: 'Max Tokens', type: 'number', defaultValue: 2048 }
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
        if (f.type === 'select') {
          fieldsHtml += `
            <div class="form-group">
              <label for="${p.key}-${f.name}">${f.label}</label>
              <div class="form-row model-row">
                <div class="form-group" style="flex:1">
                  <select id="${p.key}-${f.name}" data-provider="${p.key}">
                    <option value="">Loading models...</option>
                  </select>
                </div>
              </div>
              <div id="${p.key}-${f.name}-custom-wrap" style="display:none;margin-top:6px;">
                <input type="text" id="${p.key}-${f.name}-custom" placeholder="Enter model name..." ${f.required ? 'required' : ''}>
              </div>
            </div>
          `;
        } else if (f.type === 'number') {
          fieldsHtml += `
            <div class="form-group">
              <label for="${p.key}-${f.name}">${f.label}</label>
              <input type="number" id="${p.key}-${f.name}"
                value="${f.defaultValue || ''}"
                min="1" max="999999" step="1">
            </div>
          `;
        } else {
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
        }
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

      const modelSelect = card.querySelector(`#${p.key}-model`);
      if (modelSelect) {
        modelSelect.addEventListener('change', () => onModelChange(p.key));
      }
    });
  }

  function onModelChange(providerKey) {
    const select = document.getElementById(`${providerKey}-model`);
    const customWrap = document.getElementById(`${providerKey}-model-custom-wrap`);
    const customInput = document.getElementById(`${providerKey}-model-custom`);
    if (select.value === '__custom__') {
      customWrap.style.display = 'block';
      if (customInput) customInput.focus();
    } else {
      customWrap.style.display = 'none';
    }
  }

  function getModelValue(providerKey) {
    const select = document.getElementById(`${providerKey}-model`);
    const customInput = document.getElementById(`${providerKey}-model-custom`);
    if (select.value === '__custom__') {
      return customInput ? customInput.value.trim() : '';
    }
    return select.value;
  }

  function setModelValue(providerKey, model) {
    const select = document.getElementById(`${providerKey}-model`);
    const customWrap = document.getElementById(`${providerKey}-model-custom-wrap`);
    const customInput = document.getElementById(`${providerKey}-model-custom`);

    if (!select) return;

    const optionExists = Array.from(select.options).some(o => o.value === model);
    if (optionExists && model) {
      select.value = model;
      customWrap.style.display = 'none';
    } else {
      select.value = '__custom__';
      if (customInput) customInput.value = model || '';
      customWrap.style.display = model ? 'block' : 'none';
    }
  }

  async function populateModelDropdown(providerKey, models) {
    const select = document.getElementById(`${providerKey}-model`);
    if (!select) return;

    select.innerHTML = '';
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.value;
      opt.textContent = m.label;
      select.appendChild(opt);
    });

    const customOpt = document.createElement('option');
    customOpt.value = '__custom__';
    customOpt.textContent = 'Custom\u2026';
    select.appendChild(customOpt);
  }

  async function fetchModelsForProvider(providerKey, apiKey, baseUrl) {
    const select = document.getElementById(`${providerKey}-model`);
    if (!select) return;

    try {
      const result = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'fetchModels',
          provider: providerKey,
          apiKey: apiKey || '',
          baseUrl: baseUrl || ''
        }, r => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else if (r?.error) reject(new Error(r.error));
          else resolve(r?.models || []);
        });
      });

      if (result && result.length > 0) {
        await populateModelDropdown(providerKey, result);
      } else {
        await populateModelDropdown(
          providerKey,
          (FALLBACK_MODELS[providerKey] || []).map(m => ({ value: m, label: m }))
        );
      }
    } catch {
      await populateModelDropdown(
        providerKey,
        (FALLBACK_MODELS[providerKey] || []).map(m => ({ value: m, label: m }))
      );
    }
  }

  async function loadSettings() {
    const result = await new Promise(resolve => {
      chrome.storage.local.get(['apiKeys', 'provider', 'model', 'baseUrl', 'maxTokens'], resolve);
    });

    document.getElementById('defaultProvider').value = result.provider || 'openrouter';
    const apiKeys = result.apiKeys || {};
    const models = result.model || {};
    const baseUrls = result.baseUrl || {};
    const maxTokens = result.maxTokens || {};

    PROVIDERS.forEach(p => {
      const keys = apiKeys[p.key] || {};
      p.fields.forEach(f => {
        const el = document.getElementById(`${p.key}-${f.name}`);
        if (!el) return;
        if (f.name === 'apiKey') el.value = keys.apiKey || '';
        else if (f.name === 'model') {
          fetchModelsForProvider(p.key, keys.apiKey, baseUrls[p.key]);
          setModelValue(p.key, models[p.key] || '');
        } else if (f.name === 'baseUrl') {
          el.value = baseUrls[p.key] || f.defaultValue || '';
        } else if (f.name === 'maxTokens') {
          el.value = maxTokens[p.key] || f.defaultValue || 2048;
        }
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
    const maxTokens = {};

    PROVIDERS.forEach(p => {
      const data = {};
      p.fields.forEach(f => {
        const el = document.getElementById(`${p.key}-${f.name}`);
        if (!el) return;
        if (f.name === 'apiKey') {
          data.apiKey = el.value.trim();
        } else if (f.name === 'model') {
          models[p.key] = getModelValue(p.key) || f.defaultValue || '';
        } else if (f.name === 'baseUrl') {
          baseUrls[p.key] = el.value.trim() || f.defaultValue || 'http://localhost:11434';
        } else if (f.name === 'maxTokens') {
          const val = parseInt(el.value, 10);
          maxTokens[p.key] = (!isNaN(val) && val > 0) ? val : (f.defaultValue || 2048);
        }
      });
      if (data.apiKey) apiKeys[p.key] = data;
    });

    const provider = document.getElementById('defaultProvider').value;
    await new Promise(resolve =>
      chrome.storage.local.set({ apiKeys, provider, model: models, baseUrl: baseUrls, maxTokens }, resolve)
    );

    PROVIDERS.forEach(p => {
      const keys = apiKeys[p.key] || {};
      updateBadge(p.key, keys.apiKey);
    });

    showGlobal('Settings saved.', 'ok');
  }

  async function testConnection(providerKey) {
    const apiKeyEl = document.getElementById(`${providerKey}-apiKey`);
    const modelEl = document.getElementById(`${providerKey}-model`);
    const modelCustomEl = document.getElementById(`${providerKey}-model-custom`);
    const baseUrlEl = document.getElementById(`${providerKey}-baseUrl`);
    const msgEl = document.getElementById(`msg-${providerKey}`);
    const btn = document.querySelector(`.test-btn[data-provider="${providerKey}"]`);

    const apiKey = apiKeyEl?.value?.trim() || '';
    const model = modelCustomEl?.value?.trim() || modelEl?.value || undefined;
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
