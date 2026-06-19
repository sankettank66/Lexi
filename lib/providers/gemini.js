(function () {
  const Base = self.AIProviders.Base;

  class GeminiProvider extends Base {
    static get key() { return 'gemini'; }
    static get label() { return 'Gemini'; }

    get configFields() {
      return [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'AIzaSy...' },
        { name: 'model', label: 'Model', type: 'text', required: false, placeholder: 'gemini-2.0-flash', defaultValue: 'gemini-2.0-flash' }
      ];
    }

    get supportsModels() { return true; }
    get defaultModel() { return 'gemini-2.0-flash'; }

    constructor(apiKey, model) {
      super(apiKey);
      this.model = model || this.defaultModel;
    }

    async callAPI(prompt) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 2048,
              topP: 0.95
            }
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const errorBody = await response.text().catch(() => '');
          if (response.status === 400) {
            const errData = tryParseJSON(errorBody);
            if (errData?.error?.message?.includes('API_KEY_INVALID')) {
              throw new Error('Invalid Gemini API key. Please check your settings.');
            }
            if (errData?.error?.message?.includes('not supported')) {
              throw new Error(`Model "${this.model}" not found or not supported. Check the model name.`);
            }
            throw new Error(`Gemini API error: ${errData?.error?.message || errorBody}`);
          }
          if (response.status === 403) throw new Error('Gemini API access denied. Check your API key permissions.');
          if (response.status === 429) throw new Error('Gemini rate limit reached. Please wait and try again.');
          throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
        }

        const data = await response.json();
        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) {
          const blockReason = data?.candidates?.[0]?.finishReason;
          if (blockReason && blockReason !== 'STOP') {
            throw new Error(`Response blocked by Gemini: ${blockReason}`);
          }
          throw new Error('Empty response from Gemini. Please try again.');
        }
        return content.trim();
      } catch (err) {
        if (err.name === 'AbortError') throw new Error('Gemini request timed out. Please try again.');
        throw err;
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  function tryParseJSON(str) {
    try { return JSON.parse(str); } catch { return null; }
  }

  self.AIProviders = self.AIProviders || {};
  self.AIProviders.Gemini = GeminiProvider;
})();
