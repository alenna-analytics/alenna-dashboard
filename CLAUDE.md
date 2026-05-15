# alenna-analytics-dashboard — AI & developer guide

**Stack:** Vite, React, TypeScript, Tailwind v4, shadcn-style primitives under `src/ui/`, Clerk, TanStack Query, Recharts.

**Layout manifest:** [`src/README.md`](src/README.md) — `ui` (design system), `shell` (app chrome + providers), `pages` (routes, grouped by area).

**API:** Calls go through **`src/lib/api/`** (`apiFetch`, etc.) and hooks to **alenna-analytics-api**; no direct database access.

**Routing:** `src/App.tsx` — public `/`, `/500`; authenticated `/dashboard` under `AppAuthBoundary` with **`AppShellLayout`** from `src/shell/layout/app-shell-layout.tsx`. Integrations: list `/dashboard/integrations` (`pages/integrations/dashboard/IntegrationsListPage`), detail `/dashboard/integrations/:slug` (`pages/integrations/details/IntegrationDetailPage`); `/dashboard/connections` redirects to `/dashboard/integrations`.

**Copy & i18n:** User-visible strings use **`src/lib/i18n/shell-strings.ts`** (`shellT(lang, key)`) with parallel `en` / `es` entries.

**Tokens:** Semantic colors and charts live in **`src/index.css`** (`:root`, `.dark`, `@theme inline`) — prefer `bg-bg-*`, `text-text-*`, `--chart-*`, shadcn aliases (`bg-card`, `border-border`, …).

**UI workflow:** `skills/ui-design/SKILL.md`.

**Scripts:** `pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm typecheck` · `pnpm test`
