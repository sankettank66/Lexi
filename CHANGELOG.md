# Changelog

All notable changes to the Lexi extension are documented here.

---

## v1.2.0 — Branding & Polish

- **feat(ui):** Add Logo.jsx SVG component and use in content tooltip
- **feat(brand):** Replace extension icons with new Lexi logo
- **feat(brand):** Add inline logo SVG and favicon to extension pages
- **docs:** Fix ASCII art alignment in README architecture diagram

---

## v1.1.0 — React Rewrite & Glassmorphism Redesign

### Highlights
- Complete UI rewrite with React 19 + Tailwind CSS v4
- Apple-style glassmorphism design system
- Product renamed from "AI Grammar Assistant" to "Lexi"

### Features
- Implement floating sparkle dot interaction and state machine
- Add Apple-style glass effects (blur 50-60px, warm-dark backgrounds)
- Build glass utility classes and animation suite
- Add inline loading spinner with random status phrases
- Replace green accent with blue (#3b82f6)
- Use Instrument Serif and Instrument Sans fonts

### Rebrand
- Rename extension to "Lexi — AI Writing Assistant"
- Simplify action IDs: fix-grammar → fix, rephrase → rewrite
- Update context menu and button labels

### Infrastructure
- Add CI/CD build workflow (push + PR to main)
- Restructure project into organized src/ directories
- Add release workflow with manual dispatch support
- Add issue templates, CONTRIBUTING.md, and commit message template
- Fix service worker registration error (move background.js to root)

---

## v1.0.1 — Bug Fixes & UI Enhancements

- Resolve critical bugs in provider registration and API key storage
- Fix CSS isolation and Shadow DOM event retargeting
- Fix context menu content script injection timing
- Add design system with consistent spacing and typography
- Implement typing animation effect and inline text replacement
- Add Accept/Decline/Fix Again interaction flow
- Rename DESIGN.md to design.md for consistent naming

---

## v1.0.0 — Initial Release

### Provider Architecture
- Abstract BaseProvider class with common interface
- Auto-registration pattern via self.AIProviders registry
- Action-based dispatch system for grammar correction and rephrasing
- Prompt templates for fix and rewrite actions

### AI Providers
- **OpenRouter:** gpt-4o-mini, 30s timeout, custom headers
- **Gemini:** gemini-2.0-flash, 30s timeout
- **OpenAI:** gpt-4o-mini, Retry-After header handling
- **NVIDIA:** meta/llama-3.1-8b-instruct, 30s timeout
- **Ollama:** llama3.2, 60s timeout, configurable base URL

### Extension Pages
- **Content Script:** Floating overlay UI with Shadow DOM isolation
- **Options Page:** Provider configuration dashboard with API keys and test connection
- **Popup:** Quick provider switching with connection status indicator
- **Background:** Context menus and message routing service worker

### Documentation
- Architecture overview with ASCII diagram
- Development setup and build instructions
- Provider configuration for all five AI providers
