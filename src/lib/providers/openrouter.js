(function () {
  const Base = self.AIProviders.Base;

  const OPENROUTER_FALLBACK_MODELS = [
    'openai/gpt-4o-mini', 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash',
    'mistralai/mixtral-8x22b-instruct', 'meta-llama/llama-3.1-8b-instruct'
  ];

  class OpenRouterProvider extends Base {
    static get key() { return 'openrouter'; }
    static get label() { return 'OpenRouter'; }

    get configFields() {
      return [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'sk-or-v1-...' },
        { name: 'model', label: 'Model', type: 'text', required: false, placeholder: 'openai/gpt-4o-mini', defaultValue: 'openai/gpt-4o-mini' }
      ];
    }

    get supportsModels() { return true; }
    get defaultModel() { return 'openai/gpt-4o-mini'; }

    constructor(apiKey, model) {
      super(apiKey);
      this.model = model || this.defaultModel;
    }

    static async getAvailableModels(apiKey) {
      if (!apiKey) return OPENROUTER_FALLBACK_MODELS.map(m => ({ value: m, label: m }));
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!response.ok) return OPENROUTER_FALLBACK_MODELS.map(m => ({ value: m, label: m }));
        const data = await response.json();
        const models = (data.data || [])
          .filter(m => m.id)
          .map(m => ({ value: m.id, label: m.name || m.id }));
        return models.length > 0 ? models : OPENROUTER_FALLBACK_MODELS.map(m => ({ value: m, label: m }));
      } catch {
        return OPENROUTER_FALLBACK_MODELS.map(m => ({ value: m, label: m }));
      }
    }

    async callAPI(prompt) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://github.com/anomalyco/lexi-chrome-ext',
            'X-Title': 'Lexi'
          },
          body: JSON.stringify({
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: this.maxTokens || 2048
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const errorBody = await response.text().catch(() => '');
          if (response.status === 401) throw new Error('Invalid OpenRouter API key. Please check your settings.');
          if (response.status === 429) throw new Error('OpenRouter rate limit reached. Please wait and try again.');
          throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (!content) throw new Error('Empty response from OpenRouter. Please try again.');
        return content.trim();
      } catch (err) {
        if (err.name === 'AbortError') throw new Error('OpenRouter request timed out. Please try again.');
        throw err;
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  self.AIProviders = self.AIProviders || {};
  self.AIProviders.OpenRouter = OpenRouterProvider;
})();
