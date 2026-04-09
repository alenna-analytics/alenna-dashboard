---
name: alenna-ui-design
description: Design and build pages and UI for the Alenna Analytics dashboard (React, Vite, Tailwind v4, shadcn-style primitives, Clerk). Use when adding or changing routes, layout, charts, filters, forms, or visual polish. Aligns with existing tokens in src/index.css and shell copy in src/lib/shell-strings.ts.
---

# Alenna Dashboard — UI design & implementation

**Product:** Alenna Analytics — authenticated web app for Shopify-connected analytics (tenant-scoped data from the FastAPI **alenna-api**).

**Emotional target:** Calm, analytical, product-tool feel — neutral grays, white surfaces, **accent blue** for primary actions and chart series — not a marketing microsite.

---

## 0. Brand & surfaces (this repo)

- **Shell:** `bg-bg-base` — light gray foundation (`--bg-base` in `src/index.css`).
- **Panels / cards:** `bg-bg-surface` or shadcn `card` mapped to surface tokens.
- **Text:** `text-text-primary` / `text-text-secondary` / `text-text-tertiary` (see `--text-*` in `:root` and `.dark`).
- **Accent:** `--accent` (blue `#5b8cff` family) — primary buttons, links, focus rings, default chart series **`chart-1`**.
- **Typography:** **Geist Variable** sans, **Geist Mono** for IDs / numeric tabular data where useful (`--font-sans`, `--font-mono` in `@theme`).
- **Dark mode:** `.dark` overrides in `index.css`; use semantic tokens (`bg-background`, `text-foreground`, `border-border`, or `bg-bg-*`) so both themes work.

Do **not** copy palettes from other products (e.g. navy/jade systems from unrelated codebases). **Source of truth = `src/index.css`**.

---

## 1. Repository map (where things live)

| Area | Path |
|------|------|
| Routes | `src/App.tsx` — `/` marketing/home, `/dashboard/*` behind `AppAuthBoundary` |
| App shell | `src/pages/app-shell-layout.tsx` — sidebar + header + outlet |
| Sidebar / header | `src/components/layout/app-sidebar.tsx`, `app-header.tsx`, `app-boot-loader.tsx` |
| i18n (EN/ES) | `src/lib/shell-strings.ts` — **`shellT(lang, key)`**; add keys to **both** `en` and `es` objects |
| Language | `src/components/providers/language-provider.tsx` — `useLanguage()` |
| Theme | `src/components/providers/theme-provider.tsx` |
| Data / API | `@tanstack/react-query`, hooks under `src/hooks/` (e.g. `use-app-bootstrap.ts`) |
| Utilities | `src/lib/utils.ts` — **`cn()`** for class names |
| Charts | **Recharts** is a dependency (`recharts`); series colors should use **`--chart-1` … `--chart-5`**, **`--chart-grid`**, etc. |

New **pages** go under `src/pages/` and get wired in `App.tsx` (nested under `/dashboard` when authenticated).

---

## 2. Workflow — tokens first, then composition, then page

1. Confirm layout: usually **full-width content** inside `app-shell-layout` **`<main>`** (existing padding).
2. List UI pieces; prefer **composing** `src/components/ui/*` (Button, Card, Input, Select, Table, Tabs, Dialog, …).
3. Any **user-visible string** → add to **`shell-strings.ts`** (both locales); use `shellT(lang, '…')` from `useLanguage()`.
4. New route → **`App.tsx`** + optional nav item in **`app-sidebar.tsx`**.
5. Data → typed API client / hooks; align types with **`alenna-api`** Pydantic schemas.

If a one-off primitive is truly missing, add it under `src/components/ui/` following existing shadcn-style patterns (Radix/Base UI as already used).

---

## 3. Design tokens (`src/index.css`)

### Semantic layers (prefer these in new code)

- **Backgrounds:** `bg-base`, `bg-section`, `bg-surface`, `bg-elevated`, `bg-sunken` (mapped in `@theme inline` as `--color-bg-*`).
- **Text:** `text-primary`, `text-secondary`, `text-tertiary`, `text-disabled`.
- **Borders:** `border-border-subtle`, `border-border-default`, `border-border-strong`.
- **Status:** `success`, `danger`, `warning`, `info` (+ `-dim` variants) for alerts, badges, inline state — not for large backgrounds.

### Charts

- **`--chart-1` … `--chart-5`** — distinct series; **`--chart-grid`** — gridlines; align with CSS variables so light/dark stay consistent.
- Avoid hardcoded hex in chart config when a token exists.

### shadcn compatibility

- Legacy shadcn names (`background`, `foreground`, `primary`, `muted`, `card`, …) are wired to the same system in `:root` — you can use `bg-card`, `text-muted-foreground`, `border-border`, etc., interleaved with `bg-bg-surface` where documented in existing pages.

---

## 4. Component inventory (current)

**Layout:** `app-sidebar`, `app-header`, `app-boot-loader`, `app-error-boundary`.

**UI primitives (`src/components/ui/`):** `button`, `card`, `input`, `label`, `select`, `table`, `tabs`, `dialog`, `dropdown-menu`, `popover`, `command`, `calendar`, `badge`, `tooltip`, `skeleton`, `scroll-area`, `separator`.

**Providers:** `app-providers`, `query-provider`, `workspace-context`, `page-chrome-context`, `currency-provider`, `language-provider`, `theme-provider`.

**Auth:** `components/auth/auth-login-page.tsx` (used from `HomePage`).

There is **no** separate `MetricBlock` / `DataTable` wrapper in this repo yet — **introduce small composed components** next to the feature or under `src/components/` when the same pattern repeats (e.g. `components/charts/` for a shared graph shell).

---

## 5. Layout patterns

### App shell

- **Sidebar:** brand strip + nav links (`NavLink` to `/dashboard`, etc.). Active state: muted background + primary text (see existing `app-sidebar` classes).
- **Header:** theme toggle, language toggle, user menu — **no duplicate page title** if the sidebar already shows brand.
- **Main:** scrollable region; preserve **`motion-safe:animate-[boot-shell-enter…]`** pattern only where already used for consistency.

### Page content

- Default padding comes from **`app-shell-layout`** (`px-6 py-6` / responsive lg padding). New pages should not double massive outer padding unless necessary.
- **Page title:** `text-2xl font-semibold tracking-tight text-text-primary` or match `WelcomeDashboardPage` / nearest sibling.

### Routing

- **Public:** `/`, `/500`.
- **Authenticated:** `/dashboard`, `/dashboard/...` — wrap feature routes in the same `AppAuthBoundary` + `AppShellLayout` structure as existing routes.

---

## 6. Data & API

- Base URL for API calls should follow existing hooks/env (Vite `import.meta.env` pattern used in the project).
- **Clerk** provides the session; attach **Bearer** token to **`alenna-api`** requests as existing bootstrap code does.
- Loading / error: reuse **skeleton**, **alerts**, or workspace error patterns from `app-shell-layout` / bootstrap hooks.

---

## 7. Code standards

- **Named exports** for components; **`cn()`** for conditional Tailwind classes.
- **No raw hex** in new JSX for theme colors — use tokens / `bg-*` / `text-*` from the design system above.
- **Accessibility:** meaningful **`aria-label`** for icon-only controls; chart summaries for screen readers where possible.
- **Motion:** subtle only (`transition-colors`, existing keyframes); no decorative motion that obscures data.

---

## 8. Response format (when helping implement)

1. Tokens / layout decision (shell vs full-bleed).
2. Route + file list (`pages/`, `components/`, `shell-strings` keys).
3. Code.
4. How to verify (URL, tenant, connected store if applicable).

---

## Anti-patterns

- Hardcoded English/Spanish strings in components **without** `shell-strings.ts`.
- One-off hex colors ignoring `index.css`.
- Bypassing **`AppShellLayout`** for authenticated analytics pages (breaks nav + header).
- Duplicating API types instead of sharing shapes with the backend contract.
- Nobo/KYB/legacy patterns from other repos — **this dashboard is Alenna-only** (see §0–1).
