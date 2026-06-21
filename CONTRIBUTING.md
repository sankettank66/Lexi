# Contributing to Lexi

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone <repo-url>
cd lexi-chrome-ext
npm install
npm run build
```

Then load `dist/` as an unpacked extension in Chrome.

## Project Structure

```
background.js       # Service worker (context menus, message routing)
src/
  lib/                # Shared library
    api.js            # Provider registry and dispatch
    utils.js          # Helpers
    providers/        # AI provider implementations
  content/            # React content script (built by Vite)
    main.jsx          # Shadow DOM injection
    App.jsx           # State machine + InlineDot UI
    index.css         # Glassmorphism classes
    components/
  options/            # Settings page (plain JS)
  popup/              # Quick-switch popup (plain JS)
dist/                 # Build output (content.js only)
```

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | Lint (if configured) |

## Commit Guidelines

Use conventional commits with scopes and bullet-point body:

```
<type>(<scope>): <subject>

- <what was changed and why (max 72 chars per line)>
- <if a bullet exceeds 72 chars, wrap to a new indented line>
```

- **Type**: `feat`, `fix`, `docs`, `refactor`, `chore`, `style`, `perf`, `test`
- **Scope**: `ui`, `api`, `lib`, `config`, `build`, `docs`, `infra`, `skill`
- **Subject**: imperative mood, no period, no leading cap
- **Body**: `-` bullet points, wrap at 72 characters, blank line after subject

## Pull Request Process

1. Create a feature branch from `main`.
2. Make your changes.
3. Run `npm run build` and verify no errors.
4. Open a PR with a clear title and description.
5. A maintainer will review and merge.

## Code Style

- No comments in code unless absolutely necessary.
- Match existing patterns (providers, API dispatch, glassmorphism UI).
- CSS is inlined into the JS bundle — no external CSS files for content.
- All glass elements use `ai-glass` utility classes from `index.css`.
