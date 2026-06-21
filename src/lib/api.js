(function () {
  const PROVIDER_MAP = {};

  function registerProvider(ProviderClass) {
    const key = ProviderClass.key;
    if (!key) {
      console.warn('Provider missing static key getter:', ProviderClass);
      return;
    }
    PROVIDER_MAP[key] = ProviderClass;
  }

  function getProviderClass(key) {
    const Klass = PROVIDER_MAP[key];
    if (!Klass) throw new Error(`Unknown AI provider: "${key}". Available: ${Object.keys(PROVIDER_MAP).join(', ')}`);
    return Klass;
  }

  function createProvider(key, apiKey, model, extraConfig) {
    const Klass = getProviderClass(key);
    const provider = new Klass(apiKey, model);
    if (extraConfig) {
      Object.assign(provider, extraConfig);
    }
    return provider;
  }

  function getRegisteredProviders() {
    return Object.keys(PROVIDER_MAP).map(key => ({
      key,
      label: PROVIDER_MAP[key].label || key
    }));
  }

  function getProviderConfigFields(key) {
    const Klass = PROVIDER_MAP[key];
    if (!Klass) return [];
    const instance = Object.create(Klass.prototype);
    return instance.configFields || [];
  }

  async function callAI(providerKey, action, text, apiKey, model, extraConfig) {
    const provider = createProvider(providerKey, apiKey, model, extraConfig);

    switch (action) {
      case 'fix':
        return provider.fixGrammar(text);
      case 'rewrite':
        return provider.rephrase(text);
      case 'changeTone':
        return provider.changeTone(text, extraConfig?.tone || 'professional');
      default:
        throw new Error(`Unknown action: "${action}". Use "fix", "rewrite", or "changeTone".`);
    }
  }

  async function testProviderConnection(providerKey, apiKey, model, extraConfig) {
    const provider = createProvider(providerKey, apiKey, model, extraConfig);
    return provider.testConnection();
  }

  async function fetchProviderModels(providerKey, apiKey, extraConfig) {
    const Klass = getProviderClass(providerKey);
    return Klass.getAvailableModels(apiKey, extraConfig);
  }

  (function autoRegister() {
    const classes = self.AIProviders || {};
    for (const key of Object.keys(classes)) {
      if (key !== 'Base') {
        registerProvider(classes[key]);
      }
    }
  })();

  self.AIAPI = {
    registerProvider,
    getProviderClass,
    createProvider,
    getRegisteredProviders,
    getProviderConfigFields,
    callAI,
    testProviderConnection,
    fetchProviderModels
  };
})();
