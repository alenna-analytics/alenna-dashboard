# ecommerce-analytics-dashboard — AI & developer guide

## Product context

Web app for the ecommerce analytics SaaS: connect sales channels (Shopify, Mercado Libre, …), view consolidated KPIs and charts, manage expenses, exports, billing, and sync health. Auth via Clerk (organizations = tenants). Data comes from **ecommerce-analytics-api**; this repo has **no direct database** and must not embed business rules that belong on the server.

**References:** parent workspace `tech-plan.md`, `manifest.md`, `founder-idea.md` for metrics and UX expectations.

**Stack:** Vite, React 19, TypeScript (strict), Tailwind + shadcn/ui, TanStack Query (server state), React Router, Recharts. **Package manager: pnpm only** (`packageManager` in `package.json`, lockfile `pnpm-lock.yaml`).

## Repository layout (target)

| Area | Path | Responsibility |
| --- | --- | --- |
| Pages | `src/pages/` | Route-level screens; compose layout + features; minimal logic; wire route params and auth. |
| Features / sections | `src/features/` or co-located under pages | Optional: group by domain (e.g. `analytics`, `connectors`) when the app grows. |
| UI primitives | `src/components/ui/` | Single shadcn-generated file per primitive; customize tokens/variants in place — **no duplicate Button/Table primitives**. |
| Composed | `src/components/composed/` | App-specific patterns built from `ui/` (`MetricCard`, `DataTable`, `EmptyState`, …). |
| Charts | `src/components/charts/` | Recharts wrappers + `chart-theme.ts` (CSS variables only); no API calls inside. |
| Layout | `src/components/layout/` | Shell, sidebar, header. |
| Providers | `src/components/providers/` | Theme (class on `html`), TanStack `QueryClient`, etc. |
| Hooks | `src/hooks/` | TanStack Query hooks and small composables; call API client / typed endpoints. |
| API client | `src/lib/api.ts` (and related) | HTTP client, base URL, auth header (Clerk token), typed request/response shapes shared with backend contracts. |

## Clean architecture (frontend)

**Dependencies flow downward: pages → hooks / lib → components. UI and charts do not own business rules or auth secrets.**

- **Pages** orchestrate: they use **hooks** that encapsulate server state (TanStack Query). Pages **do not** call `fetch` directly except through the shared API layer.
- **Hooks** (`useXQuery`, `useXMutation`) call **only** the typed API client (`src/lib/api.ts`). They map API DTOs to view models if needed. Hooks **do not** import React Router beyond `useParams`/`useNavigate` when necessary; avoid putting routing inside dumb components.
- **Presentational components** (`components/ui`, `components/composed`, `components/charts`) receive **props only** — no hooks that hit the network (except purely local UI state). Keep them reusable and testable.
- **No duplicate business rules:** validation, aggregation, and authorization live on the **API**. The dashboard displays, filters, and submits; it does not re-implement KPI formulas that the backend already owns.
- **Auth:** Clerk wraps the app; tokens attach to API requests in the client layer, not scattered in every component.

**Anti-patterns to avoid:**

- `fetch` or axios calls inside random components instead of hooks + `lib/api`.
- Chart or table components that import Clerk or read env for API keys.
- Copy-pasting DTO types; prefer shared types generated or hand-maintained next to `lib/api` imports from a single module.
- Putting TanStack Query `useQuery` in leaf UI primitives shared across features (keeps data boundaries clear at page/feature level).

## Design system

**Canonical visual spec:** [`design-guide.md`](design-guide.md) (tokens, typography, spacing, shine rules, tables, charts). Prefer linking and updating that file over duplicating long token tables here.

**Enforceable rules (summary of design-guide §12):**

1. No hardcoded hex in TSX — use CSS variables (`var(--…)`) or Tailwind tokens mapped in [`src/index.css`](src/index.css) (`bg-bg-surface`, `text-text-primary`, `border-border-default`, chart colors, etc.).
2. No `dark:` Tailwind classes in feature or composed code; theme is **`html.dark`** + variable overrides only (shadcn-generated `dark:` inside `components/ui` is acceptable until refit).
3. Numeric data (amounts, counts, %, IDs, SKUs) use **`font-mono`**; currency columns **right-aligned** in tables.
4. Channel colors are fixed: Shopify emerald, Amazon amber, Mercado Libre yellow (see `ChannelBadge`).
5. Gradients / glows only where the guide allows (hero metrics, positive deltas, primary CTA, active nav).
6. Dense tables: row height **`h-10`**, header styling per guide — use the shared **`DataTable`** composition.
7. **Single primitive policy:** one shadcn file per concern in `components/ui/`; extend variants there. Use **`components/composed/`** for `MetricCard`, `DataTable`, `EmptyState`, etc., instead of cloning primitives.

**Phase 4 shell:** Nested routes under `/dashboard` (`AppAuthBoundary` → `AppShellLayout`); bootstrap and `/me` loading live in `useAppBootstrap`; sidebar collapse preference in `useSidebarCollapsed` (localStorage). Default theme is **dark** (`ThemeProvider` + `class="dark"` on `<html>` in `index.html` for first paint). Legacy `/app/*` redirects to `/dashboard`. Global `AppErrorBoundary` wraps routes; `/500` and boundary show `ServerErrorPage`; unknown URLs → `NotFoundPage` (including unknown segments under `/dashboard`).

## Style & quality

- TypeScript strict; no `any`; define props and API response types explicitly.
- Tailwind + shadcn patterns; avoid inline styles and ad-hoc CSS files unless necessary.
- ESLint + format on save where configured; run `pnpm lint` / `pnpm build` before merge.

## Auto-enhance (maintain this document)

After you append **Learnings**, run an **auto-enhance** pass:

1. Promote **recurring** UI/API patterns to **Clean architecture (frontend)** or **Repository layout**.
2. Add **Product context** bullets when scope or user flows change (e.g. new connector UX).
3. Add **API client** conventions under `src/lib` when new auth or error-handling rules appear.
4. Keep **Learnings** as a log; move durable guidance upward.

## Package manager

Use **pnpm** only: `pnpm add`, `pnpm add -D`, `pnpm exec`. Commit `pnpm-lock.yaml`. `package-lock.json` is gitignored. Prefer `corepack enable` so the pinned `packageManager` version is used.

## Learnings

Chronological notes (append newest at the bottom). Then apply **Auto-enhance**.

- **Phase 3 auth:** `ClerkProvider` only in `src/main.tsx` with `publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}` and `afterSignOutUrl`; key comes from `.env.local`, not hardcoded. Conditional UI uses `<Show when="signed-in|signed-out">` plus `SignInButton` / `SignUpButton` / `UserButton`. API calls use `src/lib/api.ts` with Clerk `getToken()` for `Authorization: Bearer`. **Tenancy:** use `src/auth/hooks.ts` (`useCurrentUser`, `useCurrentTenant`, `useTenantSwitcher`) instead of importing Clerk in feature components; active tenant/role live in `publicMetadata` and the session JWT template (`org_id`, `role`) per README.

- **Phase 4 shell:** `AppProviders` (theme + TanStack Query) wrap the router inside `ClerkProvider`. Import path alias `@/` → `src/`. shadcn/ui Tailwind v4 + `@base-ui` components live in `src/components/ui`; composed patterns in `src/components/composed`; layout in `src/components/layout`; chart wrappers in `src/components/charts` with shared `chart-theme.ts` (Recharts consumes CSS variables only). React Router nested routes: `/dashboard` → `AppShellLayout` with index `DashboardPage` and `connectors`, `expenses`, `settings`, `billing`.

- **App shell layout:** Root uses `h-svh overflow-hidden` so only `<main>` scrolls (`flex-1 min-h-0 overflow-y-auto`); sidebar + header stay in view. Below `lg`, the sidebar is a fixed off-canvas drawer (`translate-x` + backdrop); `useMediaQuery` via `useSyncExternalStore`; `drawerOpen = mobileNavOpen && !isLargeScreen`; header menu button opens the drawer. Desktop collapse state applies only when `isLargeScreen` (`sidebarCollapsedUi`).

## Glossary

- **Tenant (org):** Clerk organization; selects which API tenant context the backend uses.
- **Server state:** Data from the API; prefer TanStack Query with stable query keys.
- **View model:** Shape optimized for charts/tables, derived from API DTOs in hooks or page-level mappers.
