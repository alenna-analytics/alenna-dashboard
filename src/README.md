# Alenna dashboard — frontend architecture

This document is the **layout manifest** for `src/`: where code belongs and how layers interact.

## Directory map

| Path | Responsibility |
|------|----------------|
| [`ui/`](./ui/) | Design-system **primitives** only (shadcn base-nova, Base UI, Radix where used). No `fetch`, React Query, or domain rules. |
| [`shell/`](./shell/) | **App chrome**: layout (sidebar, header, `dashboard-page`, boot loader, `app-shell-layout`), **providers**, auth login shell, `app-error-boundary`, `app-auth-boundary`. Composes `ui`. |
| [`pages/`](./pages/) | **Route-level** modules: thin composition, params, redirects. Group by area (`home/`, `dashboard/`, `errors/`, `integrations/…`). |
| [`pages/integrations/details/`](./pages/integrations/details/) | Integration **detail** route and **colocated** helpers: `IntegrationDetailPage`, Shopify/placeholder views, `integration-logo`, `use-shopify-integration`. Prefer **relative** imports inside this folder. |
| [`pages/integrations/dashboard/`](./pages/integrations/dashboard/) | Integrations **list** route (`IntegrationsListPage`) and list-only UI pieces. |
| [`pages/integrations/hooks/`](./pages/integrations/hooks/) | Integrations-area hooks (e.g. list queries). Prefer **`src/hooks/`** only for app-wide reuse. |
| [`lib/`](./lib/) | **`utils.ts`** (shadcn `cn`), **`api/`** HTTP helpers, **`i18n/shell-strings`**, **`types/`** shared DTOs, **`integrations/`** catalog + Shopify format helpers. |
| [`hooks/`](./hooks/) | Cross-cutting hooks (e.g. bootstrap, media query). |
| [`assets/`](./assets/) | Static assets referenced by the app. |
| [`auth/`](./auth/) | Auth-related hooks used with Clerk. |

## Rules

1. **`ui/`** — Presentational; use `cva` for variants; `cn` from `@/lib/utils`. No business logic.
2. **`shell/`** — Global UI frame and wiring; no domain-specific integration logic.
3. **`pages/`** — Orchestration; data loading and mutations live here, in a **`hooks/`** subfolder under the feature (e.g. `pages/integrations/hooks/`), or in **`src/hooks/`** when shared, **not** in `ui/`.
4. **Imports** — `@/ui/...`, `@/shell/...`, `@/pages/...`, `@/lib/...` as appropriate.

## Tech stack

React 19, TypeScript strict, Vite 8, Tailwind CSS v4, shadcn (base-nova), `@base-ui/react`, `lucide-react`, TanStack Query, Clerk. See repo root [`components.json`](../components.json): `ui` → `@/ui`.

## Scripts

From `alenna-dashboard/`: `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`.

## New UI primitive checklist

- [ ] Theme tokens from `index.css` where possible  
- [ ] No outer margins on the primitive root  
- [ ] No data fetching in `ui/`  
- [ ] Import: `import { … } from '@/ui/…'`  
- [ ] `pnpm typecheck` passes  

Reference implementation: [`ui/button.tsx`](./ui/button.tsx).
