---
name: glass
description: "Glassmorphism design system for Lexi — Apple-style frosted glass UI with backdrop blur, translucent surfaces, subtle borders, soft shadows, and entrance animations. Use when building or styling glass tooltips, cards, overlays, dropdowns, inputs, buttons, or any frosted-glass component."
---

# Glassmorphism Design System

## Brand Identity

A professional, trustworthy AI writing tool. Design communicates intelligence, precision, and approachability through a refined dark glass interface with subtle animations.

### Core Values
- **Precision** - Clean typography (Instrument Serif + Instrument Sans), exact spacing, deliberate color choices
- **Intelligence** - Subtle glow effects, smooth entrance animations, responsive feedback
- **Minimalism** - Content-first, no unnecessary chrome or decoration

## Color Palette

```
Glass surfaces: rgba(40,38,48,0.2-0.25) with backdrop-filter: blur(50px)
Accent: #3b82f6 (blue)
Error:  #ef4444 (red)
Warning: #f59e0b (amber)
```

## Typography

- **Instrument Serif** - Headings, titles
- **Instrument Sans** - Body text, labels, buttons, inputs

## Glass Surface Rules

Every glass component must include:
- Backdrop blur (50px for surfaces, 20px for small dots)
- Semi-transparent warm-dark background
- Subtle translucent border (rgba(255,255,255,0.02-0.03))
- Soft box-shadow for depth
- No opaque backgrounds, no hard borders

## Blur Levels

| Level | Usage |
|-------|-------|
| 20px  | Small elements (dots) |
| 50px  | Cards, tooltips, panels |

## CSS Classes

| Class | Purpose |
|-------|---------|
| `.ai-glass` | Base glass surface |
| `.ai-glass-elevated` | Elevated card/dialog |
| `.ai-glass-header` | Header bar with bottom border |
| `.ai-glass-dot` | Small floating action dot |
| `.ai-glass-tooltip` | Tooltip/dropdown surface |
| `.ai-glass-input` | Text input field |
| `.ai-glass-btn` | Secondary button |
| `.ai-glass-overlay` | Modal backdrop |
| `.animate-ai-glass-enter` | Slide-up entrance animation |
| `.animate-ai-glass-fade` | Fade-in animation |
| `.animate-ai-glass-loading-pulse` | Pulsing glow for loading state |
| `.animate-ai-glass-spin` | Spinning loader |

## Do

- Use backdrop blur on every glass surface
- Use translucent borders instead of solid borders
- Add soft colored shadows for elevation
- Use entrance animations (animate-ai-glass-enter) for new surfaces
- Layer multiple glass panels for depth

## Don't

- Use opaque backgrounds
- Use hard borders or high-contrast outlines
- Remove blur effects from glass surfaces
- Overuse heavy shadows
