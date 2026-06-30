# Design System: Realtime Chat Support

## Color strategy

**Committed** — one saturated brand colour (deep teal) carries identity.
The palette is restrained to support clarity and efficiency, not decoration.

### Brand

`oklch(0.50 0.13 190)` — deep teal.
Professional, distinctive, warm-cool balanced.

Accent: `oklch(0.55 0.18 30)` — warm coral for unread indicators,
notifications, highlights.

### Light mode

| Token | Value | Usage |
|---|---|---|
| surface | `oklch(0.985 0.002 190)` | Page background |
| surface-raised | `oklch(1 0 0)` | Cards, dialogs |
| surface-sunken | `oklch(0.95 0.004 190)` | Inputs, sidebar |
| ink | `oklch(0.12 0.01 190)` | Body text |
| ink-muted | `oklch(0.45 0.02 190)` | Secondary text |
| ink-dim | `oklch(0.60 0.015 190)` | Placeholder / disabled |
| brand | `oklch(0.50 0.13 190)` | Primary actions, active |
| brand-hover | `oklch(0.45 0.14 190)` | Brand hover |
| accent | `oklch(0.55 0.18 30)` | Unread, highlights |
| border | `oklch(0.88 0.006 190)` | Default borders |
| border-strong | `oklch(0.78 0.008 190)` | Focused / hover borders |
| success | `oklch(0.60 0.15 145)` | Resolved status |
| warning | `oklch(0.70 0.15 85)` | Open / pending |
| danger | `oklch(0.55 0.20 30)` | Errors, cancellations |

### Dark mode

| Token | Value |
|---|---|
| surface | `oklch(0.10 0.005 190)` |
| surface-raised | `oklch(0.14 0.008 190)` |
| surface-sunken | `oklch(0.08 0.003 190)` |
| ink | `oklch(0.92 0.005 190)` |
| ink-muted | `oklch(0.65 0.01 190)` |
| ink-dim | `oklch(0.50 0.01 190)` |
| brand | `oklch(0.60 0.12 190)` |
| brand-hover | `oklch(0.65 0.11 190)` |
| accent | `oklch(0.60 0.18 30)` |
| border | `oklch(0.22 0.008 190)` |
| border-strong | `oklch(0.30 0.01 190)` |

### Contrast verification

- Body text (ink): L=0.12 vs surface L=0.985 => ratio ≈ 16.5:1 ✓
- Ink-muted: L=0.45 vs surface L=0.985 => ratio ≈ 4.8:1 ✓ (≥4.5:1)
- Ink-dim on surface: L=0.60 vs L=0.985 => ratio ≈ 3.3:1 (placeholder only)
- Dark mode body: L=0.92 vs surface L=0.10 => ratio ≈ 16:1 ✓
- Dark mode ink-muted: L=0.65 vs L=0.10 => ratio ≈ 7:1 ✓

## Typography

**Font:** Inter (400, 500, 600, 700) via Google Fonts.
Chosen for exceptional legibility, tabular figures for ticket IDs, and broad
weight range in a single family.

| Role | Size | Weight | Line height |
|---|---|---|---|
| Body | 0.9375rem (15px) | 400 | 1.6 |
| Body small | 0.8125rem (13px) | 400 | 1.5 |
| Heading 1 | clamp(1.75rem, 2.5vw, 2.25rem) | 600 | 1.2 |
| Heading 2 | 1.25rem | 600 | 1.3 |
| Heading 3 | 1rem | 600 | 1.4 |
| Label | 0.8125rem | 500 | 1 |
| Code / data | 0.8125rem | 400 | 1.4 |

Rules:
- Body line-length cap: 65ch
- `text-wrap: balance` on h1–h3
- `text-wrap: pretty` on long prose
- Heading letter-spacing ≥ -0.03em (never tighter)

## Spacing

Tailwind default scale (4px base) with these additions:
- Page gutter: 1.5rem mobile, 2rem tablet+
- Section gap: 2rem between major sections
- Stack: 0.5rem between related elements, 1rem between groups

## Z-index scale

| Layer | Value |
|---|---|
| dropdown | 100 |
| sticky | 200 |
| modal-backdrop | 300 |
| modal | 400 |
| toast | 500 |
| tooltip | 600 |

## Motion

- Ease-out-quart for all transitions (`cubic-bezier(0.25, 0.75, 0.5, 1)`)
- No bounce, no elastic
- Staggered list entries: 60ms delay between items
- `@media (prefers-reduced-motion: reduce)` resolves to instant transitions
- Layout animations: never animate width/height/top/left unless truly needed
- Use transform + opacity only

## Component architecture

Shared primitives in `src/design-system/`:
- **Button** — brand, secondary, ghost, danger variants; sm/md/lg sizes
- **Input** — text, email, password; label + error state
- **Badge** — status indicators (open, in_progress, resolved, cancelled)
- **Select** — native select with consistent styling
- **ThemeToggle** — light/dark mode switch

Patterns:
- One shared tail for `@repo/shared` types across components
- No icon library — use inline SVG for the handful needed (< 5)
- All components forward refs and spread remaining props
