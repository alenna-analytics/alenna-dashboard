# UI Design Guide — Ecommerce Analytics SaaS

> For Cursor + developers implementing layouts and components.
> Stack: React 18 · Tailwind CSS · shadcn/ui · Vite

---

## 1. Design Philosophy

**Premium data-dense dark-first.** This is a tool for technical e-commerce operators who live in dashboards. Every pixel should communicate confidence and precision. The aesthetic sits between Bloomberg Terminal and Linear — dense but never cluttered, opinionated but never loud.

Three principles to hold in every decision:
- **Hierarchy over decoration** — visual weight guides the eye to the number that matters most on each screen
- **Shine with purpose** — gradients and glows mark interactive elements and key metrics, not backgrounds
- **Dark is the default** — light mode is a first-class citizen but dark is where the product feels most at home

---

## 2. Color System

Define all tokens in `tailwind.config.ts` and as CSS variables in `globals.css`.

### Base palette

```css
/* globals.css */
:root {
  /* Backgrounds — light mode */
  --bg-base:        #F4F4F5;   /* page background */
  --bg-surface:     #FFFFFF;   /* card surface */
  --bg-elevated:    #FAFAFA;   /* elevated card / popover */
  --bg-sunken:      #E4E4E7;   /* input background */

  /* Backgrounds — overlays */
  --bg-overlay:     rgba(0, 0, 0, 0.04);

  /* Text — light mode */
  --text-primary:   #09090B;
  --text-secondary: #52525B;
  --text-tertiary:  #A1A1AA;
  --text-disabled:  #D4D4D8;

  /* Border */
  --border-subtle:  rgba(0, 0, 0, 0.06);
  --border-default: rgba(0, 0, 0, 0.10);
  --border-strong:  rgba(0, 0, 0, 0.18);

  /* Brand accent — electric violet */
  --accent:         #7C3AED;
  --accent-light:   #8B5CF6;
  --accent-dim:     rgba(124, 58, 237, 0.12);

  /* Semantic */
  --success:        #10B981;
  --success-dim:    rgba(16, 185, 129, 0.12);
  --danger:         #EF4444;
  --danger-dim:     rgba(239, 68, 68, 0.12);
  --warning:        #F59E0B;
  --warning-dim:    rgba(245, 158, 11, 0.12);
  --info:           #3B82F6;
  --info-dim:       rgba(59, 130, 246, 0.12);

  /* Chart palette — fixed, accessible */
  --chart-1:        #7C3AED;   /* violet — primary channel */
  --chart-2:        #10B981;   /* emerald */
  --chart-3:        #F59E0B;   /* amber */
  --chart-4:        #3B82F6;   /* blue */
  --chart-5:        #EC4899;   /* pink */
  --chart-grid:     rgba(0, 0, 0, 0.06);
}

.dark {
  /* Backgrounds — dark mode */
  --bg-base:        #09090B;
  --bg-surface:     #111113;
  --bg-elevated:    #18181B;
  --bg-sunken:      #0D0D0F;

  /* Text — dark mode */
  --text-primary:   #FAFAFA;
  --text-secondary: #A1A1AA;
  --text-tertiary:  #52525B;
  --text-disabled:  #3F3F46;

  /* Border */
  --border-subtle:  rgba(255, 255, 255, 0.04);
  --border-default: rgba(255, 255, 255, 0.08);
  --border-strong:  rgba(255, 255, 255, 0.14);

  /* Brand accent — same hue, slightly brighter in dark */
  --accent:         #8B5CF6;
  --accent-light:   #A78BFA;
  --accent-dim:     rgba(139, 92, 246, 0.15);

  /* Semantic — same hue, same opacity dim */
  --success:        #10B981;
  --success-dim:    rgba(16, 185, 129, 0.15);
  --danger:         #F87171;
  --danger-dim:     rgba(248, 113, 113, 0.15);
  --warning:        #FBB040;
  --warning-dim:    rgba(251, 176, 64, 0.15);
  --info:           #60A5FA;
  --info-dim:       rgba(96, 165, 250, 0.15);

  --chart-grid:     rgba(255, 255, 255, 0.05);
}
```

### Tailwind mapping

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      bg: {
        base:     'var(--bg-base)',
        surface:  'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        sunken:   'var(--bg-sunken)',
      },
      text: {
        primary:   'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary:  'var(--text-tertiary)',
      },
      border: {
        subtle:  'var(--border-subtle)',
        default: 'var(--border-default)',
        strong:  'var(--border-strong)',
      },
      accent: {
        DEFAULT: 'var(--accent)',
        light:   'var(--accent-light)',
        dim:     'var(--accent-dim)',
      },
      success: 'var(--success)',
      danger:  'var(--danger)',
      warning: 'var(--warning)',
    }
  }
}
```

---

## 3. Typography

Font pairing: **Geist** (display + UI numbers) + **Geist Mono** (data values, code, SKUs).
Geist is Vercel's typeface — sharp, modern, built for dense UIs. Load via `@fontsource/geist`.

```css
/* globals.css */
--font-display: 'Geist', system-ui, sans-serif;
--font-mono:    'Geist Mono', 'JetBrains Mono', monospace;
```

### Type scale

| Role         | Size             | Weight | Color          | Usage                             |
| ------------ | ---------------- | ------ | -------------- | --------------------------------- |
| `display`    | 32px / 2rem      | 600    | text-primary   | Page hero numbers (total revenue) |
| `heading-lg` | 20px / 1.25rem   | 600    | text-primary   | Page titles                       |
| `heading-md` | 16px / 1rem      | 600    | text-primary   | Card titles, section headers      |
| `heading-sm` | 13px / 0.8125rem | 600    | text-secondary | Table headers, labels             |
| `body`       | 14px / 0.875rem  | 400    | text-primary   | Default body text                 |
| `body-sm`    | 13px / 0.8125rem | 400    | text-secondary | Supporting text, descriptions     |
| `caption`    | 12px / 0.75rem   | 400    | text-tertiary  | Timestamps, metadata              |
| `mono`       | 13px / 0.8125rem | 400    | text-primary   | Numbers, IDs, amounts             |
| `mono-lg`    | 24px / 1.5rem    | 600    | text-primary   | KPI values in metric cards        |

**Rule:** All currency amounts, order counts, percentages, and IDs always use `font-mono`. Never render data values in the display font.

---

## 4. Spacing & Layout

### Grid system

```
Sidebar:     240px fixed (collapsed: 64px)
Content:     flex-1, max-width: none
Page padding: px-6 py-6 (24px)
Card gap:    gap-4 (16px) default, gap-6 (24px) for major sections
```

### Spacing scale in use

| Token     | px   | Use                                              |
| --------- | ---- | ------------------------------------------------ |
| `space-1` | 4px  | Icon-to-label gap, badge padding                 |
| `space-2` | 8px  | Internal card padding (tight), row gap in tables |
| `space-3` | 12px | Button padding horizontal                        |
| `space-4` | 16px | Card gap, section internal padding               |
| `space-5` | 20px | Card padding                                     |
| `space-6` | 24px | Page padding, section gap                        |
| `space-8` | 32px | Between major sections                           |

### Border radius

```
--radius-sm:  4px    inputs, badges, small chips
--radius-md:  8px    buttons, small cards
--radius-lg:  12px   standard cards
--radius-xl:  16px   modals, large panels
--radius-2xl: 24px   hero cards, feature panels
```

---

## 5. The Shine System

Gradients and glows are used **only** in these three contexts. Never on plain backgrounds.

### 5.1 Metric card accent (hero KPIs)

The top metric cards on the dashboard get a subtle gradient border and a faint glow. Implemented as a wrapper with a gradient border trick:

```tsx
// Gradient border card — wrap with this for hero metrics
<div className="relative p-px rounded-2xl bg-gradient-to-br from-accent/40 via-transparent to-transparent">
  <div className="bg-bg-surface rounded-2xl p-5">
    {/* card content */}
  </div>
</div>
```

### 5.2 Positive delta badge

Green deltas (revenue up, margin up) get a glow. Red deltas never glow.

```tsx
// +12.4% badge
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono
  bg-success/10 text-success
  shadow-[0_0_8px_rgba(16,185,129,0.25)]">
  ↑ 12.4%
</span>
```

### 5.3 Active nav item

The selected sidebar item gets a violet left border and a faint violet glow behind it:

```tsx
<div className="relative flex items-center gap-3 px-3 py-2 rounded-lg
  bg-accent/10 text-accent
  before:absolute before:left-0 before:top-2 before:bottom-2
  before:w-0.5 before:rounded-full before:bg-accent">
```

### 5.4 Chart tooltips

Tooltip background is `bg-elevated` with a `border-border-default` and a very subtle `shadow-[0_4px_24px_rgba(0,0,0,0.4)]` in dark mode.

### What NEVER gets a gradient or glow
- Page backgrounds
- Table rows
- Empty states
- Loading skeletons
- Non-metric cards (connector status, expense lists)

---

## 6. Component Patterns

### 6.1 Metric card (KPI)

The primary component of the dashboard. Two variants: **hero** (large, gradient border) and **standard** (flat).

```tsx
// Standard metric card
<div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-3">
  <div className="flex items-center justify-between">
    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
      Gross Revenue
    </span>
    <span className="text-xs text-text-tertiary font-mono">MXN</span>
  </div>
  <div className="space-y-1">
    <p className="text-3xl font-semibold font-mono text-text-primary">
      $284,391
    </p>
    <div className="flex items-center gap-2">
      <span className="delta-positive">↑ 8.2%</span>
      <span className="text-xs text-text-tertiary">vs last period</span>
    </div>
  </div>
</div>
```

### 6.2 Data table

Dense tables are the core of this product. Rules:
- Row height: `h-10` (40px) — never taller unless expanding
- Header: `text-xs font-semibold uppercase tracking-wider text-text-secondary`
- Alternating rows: `even:bg-bg-elevated` (very subtle, never striped heavily)
- Hover: `hover:bg-accent/5 cursor-pointer`
- Amounts: always right-aligned, `font-mono`
- Status badges: left-aligned, pill shape

```tsx
<table className="w-full text-sm">
  <thead>
    <tr className="border-b border-border-subtle">
      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">
        Product
      </th>
      <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">
        Revenue
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-border-subtle hover:bg-accent/5 transition-colors">
      <td className="py-2.5 px-4 text-text-primary">Product name</td>
      <td className="py-2.5 px-4 text-right font-mono text-text-primary">$12,430</td>
    </tr>
  </tbody>
</table>
```

### 6.3 Channel badge

Each platform has a fixed color chip. Never use generic gray for platforms.

```tsx
const CHANNEL_STYLES = {
  shopify:      'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  amazon:       'bg-amber-500/10   text-amber-500   border-amber-500/20',
  mercadolibre: 'bg-yellow-400/10  text-yellow-500  border-yellow-400/20',
}

<span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${CHANNEL_STYLES[channel]}`}>
  {channel}
</span>
```

### 6.4 Sidebar navigation

```
Width:        240px
Background:   bg-bg-surface (not bg-base — slightly elevated)
Border:       border-r border-border-subtle
Logo area:    h-16, px-5
Nav items:    h-9, px-3, gap-3, rounded-lg, text-sm
Section label: text-[11px] uppercase tracking-widest text-text-tertiary px-3 mt-6 mb-1
```

Company switcher lives at the **top** of the sidebar, below the logo. It's a button that opens a popover with the list of companies the user belongs to — critical for agency users.

### 6.5 Empty state

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-12 h-12 rounded-xl bg-bg-elevated border border-border-default
    flex items-center justify-center mb-4">
    {/* icon */}
  </div>
  <p className="text-sm font-medium text-text-primary mb-1">No data yet</p>
  <p className="text-sm text-text-tertiary mb-4">Connect a channel to start syncing</p>
  <Button size="sm">Connect channel</Button>
</div>
```

### 6.6 Sync status indicator

Small pill shown next to connector names everywhere:

```tsx
const STATUS = {
  active:  { dot: 'bg-success', label: 'Synced',  class: 'text-success' },
  syncing: { dot: 'bg-warning animate-pulse', label: 'Syncing', class: 'text-warning' },
  error:   { dot: 'bg-danger',  label: 'Error',   class: 'text-danger' },
  expired: { dot: 'bg-text-tertiary', label: 'Reconnect', class: 'text-text-tertiary' },
}
```

---

## 7. shadcn/ui Overrides

Override these shadcn defaults in your component layer or `globals.css`:

```css
/* Card — use our surface token */
.card { background: var(--bg-surface); border-color: var(--border-default); }

/* Input */
.input {
  background: var(--bg-sunken);
  border-color: var(--border-default);
  font-family: var(--font-mono);   /* inputs for amounts use mono */
}

/* Button — primary uses accent */
.btn-primary {
  background: var(--accent);
  box-shadow: 0 0 20px rgba(124, 58, 237, 0.3);  /* violet glow on primary CTA only */
}
.btn-primary:hover {
  box-shadow: 0 0 28px rgba(124, 58, 237, 0.45);
}

/* Badge */
.badge { font-family: var(--font-mono); font-size: 11px; }

/* Dialog / Sheet */
.dialog-content { background: var(--bg-elevated); border-color: var(--border-default); }
```

---

## 8. Charts (Recharts)

All charts use the CSS variable color palette. Never hardcode hex in chart config.

```tsx
// Shared chart config
const CHART_CONFIG = {
  style: { background: 'transparent' },
  colors: ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'],
}

// CartesianGrid
<CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />

// Axis
<XAxis
  tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
  axisLine={false}
  tickLine={false}
/>

// Tooltip
<Tooltip
  contentStyle={{
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    borderRadius: '8px',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
  }}
/>
```

**Chart height standards:**
- Sparkline (inline in card): `h-12` (48px)
- Small chart (secondary panel): `h-40` (160px)
- Main chart (full panel): `h-64` (256px)
- Expanded chart (full page): `h-96` (384px)

---

## 9. Page Layout Structure

```
┌─────────────────────────────────────────────────┐
│  Sidebar (240px)  │  Top bar (h-14)              │
│                   ├─────────────────────────────┤
│  Logo             │  Page title + date filter    │
│  Company switcher │  + channel filter            │
│  ─────────────    ├─────────────────────────────┤
│  Nav items        │                              │
│                   │  Content area                │
│  ─────────────    │  px-6 py-6                   │
│  Settings         │  gap-6 between sections      │
│  User             │                              │
└───────────────────┴──────────────────────────────┘
```

### Content area grid patterns

```tsx
// KPI row — 4 metric cards
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

// Main chart + sidebar panel
<div className="grid grid-cols-3 gap-4">
  <div className="col-span-2"> {/* main chart */} </div>
  <div className="col-span-1"> {/* breakdown panel */} </div>
</div>

// Full-width table section
<div className="w-full">
```

---

## 10. Dark / Light Mode Toggle

Use `next-themes` or a manual `class` strategy on `<html>`. The `dark` class on `<html>` activates all `.dark` CSS variable overrides.

```tsx
// ThemeProvider wraps the app
// All color decisions are CSS variables — no conditional Tailwind classes like
// dark:bg-zinc-900 should appear in component code.
// Components only ever use bg-bg-surface, text-text-primary, etc.
```

**Rule:** No component should ever have `dark:` prefixed Tailwind classes. All dark mode behavior lives in the CSS variable overrides in `globals.css`. This keeps components clean and the theme system in one place.

---

## 11. Motion & Micro-interactions

Keep it subtle. This is a data tool, not a marketing site.

```css
/* Global transition — applied to interactive elements */
.interactive {
  transition: background 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
}

/* Number changes in KPI cards — count-up animation via JS (react-countup) */
/* Only on initial load, not on filter changes */

/* Skeleton loading */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
.skeleton {
  background: linear-gradient(90deg,
    var(--bg-elevated) 25%,
    var(--bg-sunken) 50%,
    var(--bg-elevated) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}
```

**What gets animation:** KPI number count-up on load, skeleton loaders, hover glow on primary buttons, active nav indicator slide.

**What never gets animation:** Table rows, chart data updates, filter changes, page transitions.

---

## 12. Key Rules for Cursor

1. **No hardcoded hex anywhere** — always `var(--token)` or a Tailwind mapped token
2. **No `dark:` prefixed classes** — dark mode is CSS variables only
3. **All numbers use `font-mono`** — amounts, counts, percentages, IDs, SKUs
4. **Amounts are always right-aligned** in tables and lists
5. **Channel colors are fixed** — Shopify=emerald, Amazon=amber, Meli=yellow, never reassigned
6. **Gradients/glows only on** — hero metric cards, positive deltas, primary CTA buttons, active nav
7. **Card border is always `border-border-default`** — never transparent, never strong
8. **Table row height is `h-10`** — never deviate unless explicitly expanding a row
9. **shadcn components are base layer only** — always apply our tokens on top, never use shadcn defaults as-is
10. **Empty states always have** — icon + title + description + CTA button, no exceptions