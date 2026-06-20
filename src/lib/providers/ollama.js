(function () {
  const Base = self.AIProviders.Base;

  class OllamaProvider extends Base {
    static get key() { return 'ollama'; }
    static get label() { return 'Ollama (Local)'; }

    get configFields() {
      return [
        { name: 'apiKey', label: 'API Key (if required)', type: 'password', required: false, placeholder: 'Optional' },
        { name: 'baseUrl', label: 'Base URL', type: 'text', required: false, placeholder: 'http://localhost:11434', defaultValue: 'http://localhost:11434' },
        { name: 'model', label: 'Model', type: 'text', required: false, placeholder: 'llama3.2', defaultValue: 'llama3.2' }
      ];
    }

    get supportsModels() { return true; }
    get defaultModel() { return 'llama3.2'; }

    constructor(apiKey, model) {
      super(apiKey || '');
      this.model = model || this.defaultModel;
      this.baseUrl = 'http://localhost:11434';
    }

    async callAPI(prompt) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      try {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            stream: false,
            options: {
              temperature: 0.3
            }
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const errorBody = await response.text().catch(() => '');
          if (response.status === 0 || errorBody.includes('Failed to fetch') || errorBody.includes('ERR_CONNECTION_REFUSED')) {
            throw new Error('Cannot connect to Ollama. Make sure Ollama is running on your machine.');
          }
          if (response.status === 404) {
            throw new Error(`Model "${this.model}" not found. Pull it first with: ollama pull ${this.model}`);
          }
          throw new Error(`Ollama error (${response.status}): ${errorBody}`);
        }

        const data = await response.json();
        const content = data?.message?.content;
        if (!content) throw new Error('Empty response from Ollama. Please try again.');
        return content.trim();
      } catch (err) {
        if (err.name === 'AbortError') throw new Error('Ollama request timed out. Is the model loaded?');
        if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_REFUSED')) {
          throw new Error('Cannot connect to Ollama. Make sure Ollama is running (http://localhost:11434).');
        }
        throw err;
      } finally {
        clearTimeout(timeout);
      }
    }

    async testConnection() {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`${this.baseUrl}/api/tags`, {
          signal: controller.signal
        });

        if (!response.ok) throw new Error(`Ollama returned status ${response.status}`);

        const data = await response.json();
        const models = data?.models || [];
        const hasModel = models.some(m => m.name && m.name.startsWith(this.model));

        if (!hasModel && models.length > 0) {
          const availableModels = models.map(m => m.name).join(', ');
          return `Ollama connected. Available models: ${availableModels}. (Default "${this.model}" not found, run: ollama pull ${this.model})`;
        }

        if (models.length === 0) {
          return 'Ollama connected but no models found. Pull a model first: ollama pull llama3.2';
        }

        return 'Ollama connected successfully.';
      } catch (err) {
        if (err.name === 'AbortError') throw new Error('Ollama connection timed out. Is it running?');
        throw new Error(`Ollama connection failed: ${err.message}`);
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  self.AIProviders = self.AIProviders || {};
  self.AIProviders.Ollama = OllamaProvider;
})();
