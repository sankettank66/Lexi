When You want to use hyphen, Don't use '—' instead use '-'.

@glass skill for glassmorphism design system.

# Versioning

- **Patch** (1.3.x) — Bug fixes, UI polish, minor style tweaks
- **Minor** (1.x.0) — New features, new UI elements, new provider support
- **Major** (x.0.0) — Breaking changes, redesigns, API overhauls

Always ask before bumping version and updating changelog.

# Commit Structure

```
<type>(<scope>): <subject>

- <bullet point (max 72 chars per line)>
- <bullet point (max 72 chars per line)>
- <bullet point (max 72 chars per line)>
```

- **Subject** uses the imperative mood, no period.
- **Body** uses `-` bullet points describing what was changed and why.
- **Body lines wrap at 72 characters** — if a bullet exceeds 72 chars, wrap to a new indented line.
- **Body blank line** separates subject from bullet list (not part of subject).
- **Scopes**: `ui`, `api`, `lib`, `config`, `build`, `docs`, `infra`, `skill`.
- **Point changes**: When amending a commit's body, re-wrap every changed
  bullet at 72 characters with proper continuation indentation.