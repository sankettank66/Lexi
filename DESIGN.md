# AI Grammar Assistant — Design System

## Brand Identity

A professional, trustworthy AI writing tool. The design communicates intelligence, precision, and approachability through a refined dark interface with subtle animations.

### Core Values
- **Precision** — Clean typography, exact spacing, deliberate color choices
- **Intelligence** — Subtle glow effects, smooth typing animations, responsive feedback
- **Minimalism** — Content-first, no unnecessary chrome or decoration

---

## Color Palette

### Dark Theme (Default)

```
Surface (bg)       #0d0d0d    — Page background, deepest layer
Surface (card)     #1a1a1a    — Cards, dropdowns, overlays
Surface (elevated) #242424    — Raised elements, hover states
Surface (border)   #2e2e2e    — Subtle borders, dividers

Text (primary)     #e8e8e8    — Body text, headings
Text (secondary)   #9ca3af    — Labels, captions, muted content
Text (disabled)    #4b5563    — Disabled states, placeholders

Accent (green)     #10b981    — Fix Grammar action, success, accept
Accent (green-hv)  #059669    — Hover state for green actions
Accent (blue)      #3b82f6    — Rephrase action, links, retry
Accent (blue-hv)   #2563eb    — Hover state for blue actions
Accent (amber)     #f59e0b    — Warnings, pending states
Accent (red)       #ef4444    — Errors, destructive actions

Overlay (backdrop) rgba(0,0,0,0.6)  — Modal backdrops
Glow (green)       rgba(16,185,129,0.15) — Subtle glow for grammar mode
Glow (blue)        rgba(59,130,246,0.15) — Subtle glow for rephrase mode
```

### Light Theme (Future)

```
Surface (bg)       #fafafa
Surface (card)     #ffffff
Surface (elevated) #f3f4f6
Surface (border)   #e5e7eb

Text (primary)     #111827
Text (secondary)   #6b7280
Text (disabled)    #9ca3af

Accent (green)     #059669
Accent (blue)      #2563eb
Accent (red)       #dc2626
```

---

## Typography

### Font Stack

```
Primary:  -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif
Mono:     'SF Mono', 'Fira Code', 'Roboto Mono', monospace
```

### Type Scale

| Token          | Size   | Weight | Line Height | Usage                        |
|----------------|--------|--------|-------------|------------------------------|
| `text-xs`      | 11px   | 500    | 1.4         | Labels, badges, timestamps   |
| `text-sm`      | 12px   | 500    | 1.4         | Buttons, captions            |
| `text-base`    | 13px   | 400    | 1.5         | Body, dropdown items         |
| `text-md`      | 14px   | 400    | 1.6         | Overlay body text            |
| `text-lg`      | 16px   | 600    | 1.5         | Section headings             |
| `text-xl`      | 20px   | 700    | 1.3         | Page titles (options)        |

---

## Spacing

### 4px Grid System

```
space-1    4px
space-2    8px
space-3    12px
space-4    16px
space-5    20px
space-6    24px
space-8    32px
space-10   40px
space-12   48px
```

### Component Padding

- **Overlay card:**   16px body, 12px header/footer
- **Buttons:**        8px 16px (sm), 10px 20px (md), 12px 24px (lg)
- **Input fields:**   10px 12px
- **Section gap:**    12px between sections

---

## Components

### Overlay Card

```
┌─────────────────────────────────────┐
│  Header (12px pad, border-bottom)    │
│  ● Fix Grammar / Rephrase           │
├─────────────────────────────────────┤
│  Body (16px pad, max-h 300px,       │
│        overflow-y: auto)             │
│                                     │
│  LABEL: Original                    │
│  [strikethrough text]               │
│                                     │
│  LABEL: Corrected                   │
│  [typing animation text]            │
│                                     │
├─────────────────────────────────────┤
│  Footer (12px pad, border-top)      │
│  [Cancel] [Try Again] [Accept]      │
└─────────────────────────────────────┘
```

**Dimensions:** min-width 320px, max-width 480px
**Border radius:** 12px
**Shadow:** 0 8px 32px rgba(0,0,0,0.4)
**Entry:** fadeIn + translateY(-8px), 0.2s ease-out

### Buttons

| Variant    | Background   | Hover         | Text    | Usage                    |
|------------|-------------|---------------|---------|--------------------------|
| Primary    | `#10b981`   | `#059669`     | White   | Accept / Save            |
| Secondary  | `#333`      | `#444`        | `#ccc`  | Cancel / Dismiss         |
| Retry      | `#3b82f6`   | `#2563eb`     | White   | Try Again                |
| Ghost      | transparent | rgba(255,255,255,0.05) | `#9ca3af` | Settings link |

**Border radius:** 6px
**Active state:** scale(0.97)
**Transition:** all 0.15s

### Input Fields

**Default:** bg `#0d0d0d`, border `#333`, text `#e8e8e8`
**Focus:** border `#10b981`, subtle glow
**Placeholder:** color `#4b5563`
**Password:** monospace font

### Status Dots

- **Connected:** 8px, `#10b981`, glow animation
- **Disconnected:** 8px, `#f59e0b`
- **Error:** 8px, `#ef4444`

---

## Animations

### Typing Effect (Gemini-style)
- Characters appear one at a time at ~35ms intervals
- Last 10 characters slow down to ~50ms for natural feel
- A blinking cursor at the end during animation
- After completion, cursor fades out

### Loading State
- Three-dot bouncing animation (instead of spinner)
- Each dot: 6px, `#10b981`, sequential bounce
- Bounce keyframes: translateY(0) → translateY(-8px) → translateY(0)
- Stagger: 0.15s delay between dots

### Overlay Entry
```css
@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
```

### Button Press
```css
@keyframes buttonPress {
  0%   { transform: scale(1); }
  50%  { transform: scale(0.96); }
  100% { transform: scale(1); }
}
```

### Skeleton Loading
- Pulsing shimmer on the corrected text area while typing
- Linear gradient sweep across the text area
- 1.5s cycle, infinite

---

## Iconography

Use simple Unicode symbols where possible to avoid external dependencies:

```
Fix Grammar  ●  (green dot)
Rephrase     ●  (blue dot)
Success      ✓  (checkmark)
Error        ⚠  (warning)
Loading      ● ● ●  (bouncing dots)
Close        ✕
Arrow        →  (right arrow)
Settings     ⚙  (gear)
Retry        ↻  (refresh)
```

---

## Layout Guidelines

### Desktop
- Overlay positions near the selected text
- Falls below selection by default, flips above if near viewport bottom
- Aligns to left of selection, shifts right if near viewport edge
- Max distance from viewport edge: 16px

### Options Page
- Single-column layout, max-width 640px, centered
- Sections stack vertically with 16px gap
- Cards with 20px padding

### Popup
- 280px fixed width
- Compact layout, single column
- No scroll needed at default size

---

## Responsive Behavior

| Breakpoint | Overlay Width |
|------------|---------------|
| > 480px    | 400px         |
| 320-480px  | calc(100vw - 32px) |
| < 320px    | 288px         |

---

## Accessibility

- All interactive elements are keyboard-accessible
- Focus indicators: 2px solid accent color
- Minimum contrast ratio: 4.5:1 for text
- Buttons have visible labels (not icon-only)
- Error messages are announced via aria-live regions
- Animations respect `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
