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

  function createProvider(key, apiKey, model) {
    const Klass = getProviderClass(key);
    return new Klass(apiKey, model);
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

  async function callAI(providerKey, action, text, apiKey, model) {
    const provider = createProvider(providerKey, apiKey, model);

    switch (action) {
      case 'fix-grammar':
        return provider.fixGrammar(text);
      case 'rephrase':
        return provider.rephrase(text);
      default:
        throw new Error(`Unknown action: "${action}". Use "fix-grammar" or "rephrase".`);
    }
  }

  async function testProviderConnection(providerKey, apiKey, model) {
    const provider = createProvider(providerKey, apiKey, model);
    return provider.testConnection();
  }

  self.AIAPI = {
    registerProvider,
    getProviderClass,
    createProvider,
    getRegisteredProviders,
    getProviderConfigFields,
    callAI,
    testProviderConnection
  };
})();
