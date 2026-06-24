# Changelog

All notable changes to the Lexi extension are documented here.

---

## v1.5.0 - Apple-Inspired Glass Refinements

- **feat(ui):** Add specular highlight (`inset 0 0.5px`) to all glass surfaces
  for a dimensional Apple-style edge-light effect
- **feat(ui):** Add press-scale (`transform: scale(0.97)`) on all tooltip
  buttons for tactile interaction feedback
- **fix(ui):** Lighten dark-mode glass backgrounds (base 40->55, tooltip
  35->50) so frosted surfaces are clearly visible against dark pages
- **fix(ui):** Remove blue tint from dot background — uses neutral warm-dark
  glass matching other tooltip surfaces
- **fix(ui):** Reduce dot blur from 50px to 20px (Apple: small controls = light
  blur for icon clarity)
- **fix(ui):** Align popup glass-panel and header-icon with the same updated
  design tokens and specular highlight
- **fix(ui):** Restrict dot activation to input, textarea, and contenteditable
  elements only

---

## v1.4.0 - Ask AI & Theme-Aware Glass

- **feat(ui):** Add Ask AI mode with inline text input for custom instructions
- **feat(ui):** Theme-aware glass — adapts to light/dark page backgrounds
- **feat(ui):** Add Instrument Serif font to tooltip headers
- **fix(ui):** Dynamic tooltip positioning — clamps to viewport, opens above/below based on space
- **fix(ui):** Result card falls back to centered modal when selection is near viewport edge

---

## v1.3.0 - Change Tone & Agent Skills

- **feat(ui):** Add Change Tone option with hover submenu (Professional, Casual, Formal, Friendly, Concise)
- **fix(ui):** Make glass surfaces more subtle with higher background opacity
- **feat(skills):** Add glass design system skill for OpenCode, Claude, and Agents
- **feat(options):** Add model dropdowns and max tokens per provider
- **fix(providers):** Strip quotes from LLM responses and fix prompt key mismatch
- **chore:** Ignore built dist/ output in git

---

## v1.2.0 - Branding & Polish

- **feat(ui):** Add Logo.jsx SVG component and use in content tooltip
- **feat(brand):** Replace extension icons with new Lexi logo
- **feat(brand):** Add inline logo SVG and favicon to extension pages
- **docs:** Fix ASCII art alignment in README architecture diagram

---

## v1.1.0 - React Rewrite & Glassmorphism Redesign

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
- Rename extension to "Lexi - AI Writing Assistant"
- Simplify action IDs: fix-grammar → fix, rephrase → rewrite
- Update context menu and button labels

### Infrastructure
- Add CI/CD build workflow (push + PR to main)
- Restructure project into organized src/ directories
- Add release workflow with manual dispatch support
- Add issue templates, CONTRIBUTING.md, and commit message template
- Fix service worker registration error (move background.js to root)

---

## v1.0.1 - Bug Fixes & UI Enhancements

- Resolve critical bugs in provider registration and API key storage
- Fix CSS isolation and Shadow DOM event retargeting
- Fix context menu content script injection timing
- Add design system with consistent spacing and typography
- Implement typing animation effect and inline text replacement
- Add Accept/Decline/Fix Again interaction flow
- Rename DESIGN.md to design.md for consistent naming

---

## v1.0.0 - Initial Release

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
