(function () {
  const Base = self.AIProviders.Base;

  class NVIDIAProvider extends Base {
    static get key() { return 'nvidia'; }
    static get label() { return 'NVIDIA'; }

    get configFields() {
      return [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'nvapi-...' },
        { name: 'model', label: 'Model', type: 'text', required: false, placeholder: 'meta/llama-3.1-8b-instruct', defaultValue: 'meta/llama-3.1-8b-instruct' }
      ];
    }

    get supportsModels() { return true; }
    get defaultModel() { return 'meta/llama-3.1-8b-instruct'; }

    constructor(apiKey, model) {
      super(apiKey);
      this.model = model || this.defaultModel;
      this.baseUrl = 'https://integrate.api.nvidia.com';
    }

    async callAPI(prompt) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
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
          if (response.status === 401) throw new Error('Invalid NVIDIA API key. Please check your settings.');
          if (response.status === 403) throw new Error('NVIDIA API access denied. Check your API key permissions.');
          if (response.status === 429) throw new Error('NVIDIA rate limit reached. Please wait and try again.');
          if (response.status >= 500) throw new Error('NVIDIA server error. Please try again later.');
          throw new Error(`NVIDIA API error (${response.status}): ${errorBody}`);
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (!content) throw new Error('Empty response from NVIDIA. Please try again.');
        return content.trim();
      } catch (err) {
        if (err.name === 'AbortError') throw new Error('NVIDIA request timed out. Please try again.');
        throw err;
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  self.AIProviders = self.AIProviders || {};
  self.AIProviders.NVIDIA = NVIDIAProvider;
})();
