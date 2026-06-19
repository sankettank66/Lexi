(function () {
  const Base = self.AIProviders.Base;

  class OpenAIProvider extends Base {
    static get key() { return 'openai'; }
    static get label() { return 'OpenAI'; }

    get configFields() {
      return [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'sk-proj-...' },
        { name: 'model', label: 'Model', type: 'text', required: false, placeholder: 'gpt-4o-mini', defaultValue: 'gpt-4o-mini' }
      ];
    }

    get supportsModels() { return true; }
    get defaultModel() { return 'gpt-4o-mini'; }

    constructor(apiKey, model) {
      super(apiKey);
      this.model = model || this.defaultModel;
    }

    async callAPI(prompt) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2048
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const errorBody = await response.text().catch(() => '');
          if (response.status === 401) throw new Error('Invalid OpenAI API key. Please check your settings.');
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const msg = retryAfter
              ? `OpenAI rate limit reached. Retry after ${retryAfter} seconds.`
              : 'OpenAI rate limit reached. Please wait and try again.';
            throw new Error(msg);
          }
          if (response.status === 500) throw new Error('OpenAI server error. Please try again later.');
          throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (!content) throw new Error('Empty response from OpenAI. Please try again.');
        return content.trim();
      } catch (err) {
        if (err.name === 'AbortError') throw new Error('OpenAI request timed out. Please try again.');
        throw err;
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  self.AIProviders = self.AIProviders || {};
  self.AIProviders.OpenAI = OpenAIProvider;
})();
