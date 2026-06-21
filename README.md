# Lexi - AI Writing Assistant

A browser extension that fixes, rewrites, and changes the tone of selected text using AI-powered language models. Supports **5 AI providers** with a pluggable architecture.

## Features

- **Fix** - Correct grammar, spelling, punctuation, and word choice
- **Rewrite** - Improve clarity, flow, and readability while preserving meaning
- **Change Tone** - Rewrite text in a Professional, Casual, Formal, Friendly, or Concise tone via hover submenu
- **5 AI Providers** - OpenRouter, Gemini, OpenAI, NVIDIA, Ollama (local)
- **Floating Dot** - Blue glass dot near selected text; click for Fix / Rewrite / Change Tone options
- **Result Card** - Shows original vs. corrected text with Accept / Decline / Again actions
- **Apple Glass UI** - Frosted glassmorphism with 50px backdrop blur and entrance animations
- **Secure** - API keys stored locally in `chrome.storage.local` (never synced)
- **React + Tailwind** - Built with React 19 and Tailwind CSS v4 for a polished UI

## Architecture

```
                    ┌─────────────────────┐
                    │   Options Page      │
                    │  (API keys/config)  │
                    └──────────┬──────────┘
                               │ chrome.storage.local
                    ┌──────────▼──────────┐
   Right-click ────►│  Background Worker  │◄──── Popup
   "Fix" / "Rewrite"│  (service worker)   │     (quick switch)
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Content Script    │
                    │  (runs on webpage)  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Overlay Popup UI   │
                    │  Accept / Fix Again │
                    │  / Decline          │
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

### Prerequisites

```bash
npm install        # Install React, Vite, Tailwind
npm run build      # Build content UI to dist/
```

### Chrome / Edge (Chromium)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `lexi-chrome-ext` folder

> After modifying `src/content/`, rebuild with `npm run build` and reload the extension.

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
| Ollama     | Local - no key needed (http://localhost:11434) |

## Usage

### Inline Dot

1. Select text on any webpage
2. A blue glass dot appears near the selection
3. Click the dot → choose **Fix**, **Rewrite**, or hover **Change Tone** to pick a tone
4. Wait for the AI response (spinner with cycling status phrases)
5. Review the result in the overlay card
6. Choose:
   - **Accept** - replaces the selected text
   - **Again** - re-sends the corrected text for another pass
   - **Decline** - dismisses the card

### Right-Click Menu

1. Select text, right-click → **Lexi** → **Fix**, **Rewrite**, or **Change Tone** > choose a tone

## Development

```
lexi-chrome-ext/
├── manifest.json              # Extension manifest (MV3)
├── background.js              # Service worker: context menus, message routing
├── AGENTS.md                  # Agent instructions (versioning, design refs)
├── design.md                  # Design system documentation
├── GLASS.md                   # Glassmorphism design skill reference
├── package.json               # Build scripts and dependencies
├── vite.config.js             # Vite build config
├── .github/workflows/build.yml # CI/CD pipeline
├── .opencode/skills/glass/    # OpenCode glass design skill
├── .agents/skills/glass/      # Agent glass design skill
├── src/
│   ├── content/               # React + Tailwind content script UI
│   │   ├── main.jsx           # Entry point (Shadow DOM injection)
│   │   ├── App.jsx            # Main state machine + InlineDot component
│   │   ├── index.css          # Tailwind + Apple glass animations + classes
│   │   └── components/
│   │       ├── Logo.jsx        # Lexi logo SVG component
│   │       └── ResultCard.jsx  # Result card with tone-aware labels
│   ├── popup/                 # Quick-switch popup
│   ├── options/               # Settings page (glassmorphism dashboard)
│   └── lib/                   # AI provider library
│       ├── api.js             # Provider registry and factory
│       ├── utils.js           # Storage helpers and utilities
│       └── providers/
│           ├── base.js        # Abstract base provider (fix, rewrite, changeTone)
│           ├── openrouter.js  # OpenRouter integration
│           ├── gemini.js      # Google Gemini integration
│           ├── openai.js      # OpenAI integration
│           ├── nvidia.js      # NVIDIA integration
│           └── ollama.js      # Ollama local integration
├── dist/                      # Built output (gitignored; run npm run build)
└── icons/                     # Extension icons
```

### Adding a New Provider

1. Create `lib/providers/yourprovider.js` extending `BaseProvider`
2. Implement `callAPI(prompt)` method
3. Define static `key` and `label` getters
4. Add `importScripts` line to `background.js`
5. Add provider entry to `options.html` and `options.js`

### Development Workflow

```bash
npm run build    # Production build
npm run dev      # Watch mode (auto-rebuilds on changes)
```

After building, reload the extension in `chrome://extensions` to see changes.

## Permissions

| Permission   | Reason                                     |
|-------------|--------------------------------------------|
| `contextMenus` | Right-click menu items for selected text |
| `storage`      | Persist API keys and user preferences     |
| `activeTab`    | Access the current tab (no `<all_urls>`)  |
| `scripting`    | Inject content script on demand           |

## Security

- API keys are stored in `chrome.storage.local` - sandboxed from webpage scripts
- Keys are **never** synced across devices (no `chrome.storage.sync`)
- All API calls originate from the extension's service worker context
- No external analytics, tracking, or telemetry

## License

MIT
