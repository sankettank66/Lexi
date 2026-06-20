(function () {
  const AIProviders = self.AIProviders || {};

  class BaseProvider {
    constructor(apiKey) {
      if (!apiKey && apiKey !== '') {
        throw new Error('API key is required');
      }
      this.apiKey = apiKey || '';
      this.maxTokens = 2048;
    }

    static async getAvailableModels(apiKey, extraConfig) {
      return [];
    }

    get key() {
      throw new Error('Provider must implement static key getter');
    }

    get label() {
      throw new Error('Provider must implement static label getter');
    }

    get configFields() {
      return [{ name: 'apiKey', label: 'API Key', type: 'password', required: true }];
    }

    get defaultModel() {
      return null;
    }

    get supportsModels() {
      return false;
    }

    buildPrompt(action, text) {
      const prompts = {
        'fix': `You are a professional proofreader and grammar expert. Fix any grammar, spelling, punctuation, and word choice errors in the following text. Return ONLY the corrected text without any explanations, quotes, or additional formatting. Do not change the meaning or tone of the original text unless it contains errors.\n\nText: "${text}"`,
        'rewrite': `You are a professional writing assistant. Rewrite the following text to improve clarity, flow, and readability while preserving the original meaning and tone. Return ONLY the rewritten text without any explanations, quotes, or additional formatting.\n\nText: "${text}"`
      };
      return prompts[action] || prompts['fix'];
    }

    async fixGrammar(text) {
      const prompt = this.buildPrompt('fix-grammar', text);
      return this.callAPI(prompt);
    }

    async rephrase(text) {
      const prompt = this.buildPrompt('rephrase', text);
      return this.callAPI(prompt);
    }

    async callAPI(prompt) {
      throw new Error('Provider must implement callAPI method');
    }

    async testConnection() {
      return this.callAPI(this.buildPrompt('fix-grammar', 'Test connection.'));
    }
  }

  AIProviders.Base = BaseProvider;
  self.AIProviders = AIProviders;
})();
