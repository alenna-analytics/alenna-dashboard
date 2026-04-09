# alenna-analytics-dashboard — AI & developer guide

**Stack:** Vite, React, TypeScript, Tailwind v4, shadcn-style primitives under `src/components/ui/`, Clerk, TanStack Query, Recharts.

**API:** Calls go through **`src/lib/api.ts`** (and hooks) to **alenna-analytics-api**; no direct database access.

**Routing:** `src/App.tsx` — public `/`, `/500`; authenticated `/dashboard` under `AppAuthBoundary` with **`AppShellLayout`** (`src/pages/app-shell-layout.tsx`: sidebar `app-sidebar`, header `app-header`, scrollable main).

**Copy & i18n:** User-visible strings use **`src/lib/shell-strings.ts`** (`shellT(lang, key)`) with parallel `en` / `es` entries.

**Tokens:** Semantic colors and charts live in **`src/index.css`** (`:root`, `.dark`, `@theme inline`) — prefer `bg-bg-*`, `text-text-*`, `--chart-*`, shadcn aliases (`bg-card`, `border-border`, …).

**UI workflow:** `skills/ui-design/SKILL.md`.

**Scripts:** `pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm typecheck` · `pnpm test`
