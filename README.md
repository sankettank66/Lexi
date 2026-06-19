# AI Grammar Assistant

A browser extension that fixes grammar and rephrases selected text using AI-powered language models. Supports **5 AI providers** with a pluggable architecture.

## Features

- **Fix Grammar** — Correct grammar, spelling, punctuation, and word choice
- **Rephrase** — Improve clarity, flow, and readability while preserving meaning
- **5 AI Providers** — OpenRouter, Gemini, OpenAI, NVIDIA, Ollama (local)
- **Overlay Popup** — Shows original vs. corrected text with Accept / Try Again / Cancel
- **Secure** — API keys stored locally in `chrome.storage.local` (never synced to cloud)
- **Lightweight** — Manifest V3, zero dependencies, no build step

## Architecture

```
                    ┌─────────────────────┐
                    │   Options Page       │
                    │  (API keys/config)   │
                    └──────────┬──────────┘
                               │ chrome.storage.local
                    ┌──────────▼──────────┐
  Right-click ─────►│  Background Worker  │◄──── Popup
  "Fix Grammar"     │  (service worker)   │     (quick switch)
  "Rephrase"        └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Content Script    │
                    │  (runs on webpage)  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Overlay Popup UI   │
                    │  Accept / Try Again │
                    │  / Cancel           │
                    └─────────────────────┘
```

### Provider Architecture

All providers extend a common `BaseProvider` class with a strategy pattern:

```
lib/providers/
├── base.js       # Abstract base: buildPrompt(), fixGrammar(), rephrase()
├── openrouter.js # OpenRouter API (unified router, many models)
├── gemini.js     # Google Gemini API
├── openai.js     # OpenAI / ChatGPT API
├── nvidia.js     # NVIDIA API Catalog
└── ollama.js     # Ollama (local LLM inference)
```

## Installation

### Chrome / Edge (Chromium)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `ai-grammar-chrome-ext` folder

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `manifest.json`

> For permanent Firefox installation, you'll need to sign the add-on via AMO.

## Configuration

1. Click the extension icon in the toolbar → **Open Settings**
2. Enter your API key(s) for your preferred provider
3. Select the default provider
4. Click **Save Settings**
5. Use the **Test** button to verify connectivity

### Getting API Keys

| Provider   | Get Key                                    |
|------------|--------------------------------------------|
| OpenRouter | https://openrouter.ai/keys                 |
| Gemini     | https://aistudio.google.com/app/apikey     |
| OpenAI     | https://platform.openai.com/api-keys       |
| NVIDIA     | https://build.nvidia.com/                  |
| Ollama     | Local — no key needed (http://localhost:11434) |

## Usage

1. Select text on any webpage
2. Right-click → **AI Grammar** → **Fix Grammar** or **Rephrase**
3. Wait for the AI response (loading spinner)
4. Review the result in the overlay popup
5. Choose:
   - **Accept** — replaces the selected text
   - **Try Again** — re-sends the request
   - **Cancel** — dismisses the overlay

## Development

```
ai-grammar-chrome-ext/
├── manifest.json          # Extension manifest (MV3)
├── background.js          # Service worker: context menus, message routing
├── content.js             # Content script: overlay UI, text replacement
├── content.css            # Overlay styles (dark theme)
├── options.html           # Settings page HTML
├── options.js             # Settings page logic
├── popup.html             # Extension popup HTML
├── popup.js               # Extension popup logic
├── lib/
│   ├── api.js             # Provider registry and factory
│   ├── utils.js           # Storage helpers and utilities
│   └── providers/
│       ├── base.js        # Abstract base provider
│       ├── openrouter.js  # OpenRouter integration
│       ├── gemini.js      # Google Gemini integration
│       ├── openai.js      # OpenAI integration
│       ├── nvidia.js      # NVIDIA integration
│       └── ollama.js      # Ollama local integration
└── icons/                 # Extension icons
```

### Adding a New Provider

1. Create `lib/providers/yourprovider.js` extending `BaseProvider`
2. Implement `callAPI(prompt)` method
3. Define static `key` and `label` getters
4. Add `importScripts` line to `background.js`
5. Add provider entry to `options.html` and `options.js`

## Permissions

| Permission   | Reason                                     |
|-------------|--------------------------------------------|
| `contextMenus` | Right-click menu items for selected text |
| `storage`      | Persist API keys and user preferences     |
| `activeTab`    | Access the current tab (no `<all_urls>`)  |
| `scripting`    | Inject content script on demand           |

## Security

- API keys are stored in `chrome.storage.local` — sandboxed from webpage scripts
- Keys are **never** synced across devices (no `chrome.storage.sync`)
- All API calls originate from the extension's service worker context
- No external analytics, tracking, or telemetry

## License

MIT
