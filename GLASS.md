# Glassmorphism Advanced

Use this skill when creating frosted glass effects, transparent overlays, modern glass UI components, or layered translucent surfaces.

## Overview

| Feature        | Description                              |
| -------------- | ---------------------------------------- |
| Blur Levels    | `sm`, `md`, `xl`, `3xl`                  |
| Opacity Layers | Multiple translucent layers for depth    |
| Colored Glass  | Tint surfaces using CSS variables        |
| Borders        | Subtle translucent borders               |
| Shadows        | Soft colored shadows for elevation       |
| Dark Mode      | Glass variants for light and dark themes |

## Core Principles

### Essential Glass Surface

Every glass component should include:

* Backdrop blur
* Semi-transparent background
* Subtle translucent border
* Soft shadow for depth
* Dark mode support

```tsx
className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl shadow-primary/10 dark:bg-black/40"
```

---

## Blur Levels

| Level   | Class               | Recommended Usage          |
| ------- | ------------------- | -------------------------- |
| Subtle  | `backdrop-blur-sm`  | Tooltips, overlays         |
| Medium  | `backdrop-blur-md`  | Cards, dropdowns           |
| Strong  | `backdrop-blur-xl`  | Primary surfaces           |
| Maximum | `backdrop-blur-3xl` | Hero sections, backgrounds |

---

## Glass Variants

### Base Glass

```tsx
className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl"
```

### Elevated Glass

```tsx
className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl shadow-primary/10 rounded-2xl"
```

### Dark Glass

```tsx
className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl"
```

---

## Layered Glass Stack

Create depth by stacking multiple translucent layers.

```tsx
<div className="relative">
  <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl rounded-3xl" />

  <div className="absolute inset-2 bg-white/10 backdrop-blur-xl rounded-2xl" />

  <div className="relative bg-white/20 backdrop-blur-md rounded-xl p-6">
    {children}
  </div>
</div>
```

---

## Dark Mode

```tsx
className="
  bg-white/10
  backdrop-blur-xl
  border border-white/20
  dark:bg-black/40
  dark:border-white/10
"
```

---

## Best Practices

### Do

* Use backdrop blur on every glass surface.
* Layer multiple glass panels for depth.
* Add soft colored shadows for elevation.
* Use translucent borders instead of solid borders.
* Support both light and dark themes.
* Prefer CSS variables for reusable glass colors.

### Don't

* Use opaque backgrounds.
* Use hard borders or high-contrast outlines.
* Remove blur effects from glass surfaces.
* Overuse heavy shadows.
* Ignore dark mode support.

---

## Design Goal

Glass surfaces should feel lightweight, translucent, layered, and integrated with the background rather than appearing as traditional solid cards.
