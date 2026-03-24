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
| UI primitives | `src/components/ui/` | shadcn/ui and thin wrappers; no data fetching. |
| Charts | `src/components/charts/` | Recharts wrappers; props in, no API calls inside. |
| Layout | `src/components/layout/` | Shell, sidebar, header. |
| Hooks | `src/hooks/` | TanStack Query hooks and small composables; call API client / typed endpoints. |
| API client | `src/lib/api.ts` (and related) | HTTP client, base URL, auth header (Clerk token), typed request/response shapes shared with backend contracts. |

## Clean architecture (frontend)

**Dependencies flow downward: pages → hooks / lib → components. UI and charts do not own business rules or auth secrets.**

- **Pages** orchestrate: they use **hooks** that encapsulate server state (TanStack Query). Pages **do not** call `fetch` directly except through the shared API layer.
- **Hooks** (`useXQuery`, `useXMutation`) call **only** the typed API client (`src/lib/api.ts`). They map API DTOs to view models if needed. Hooks **do not** import React Router beyond `useParams`/`useNavigate` when necessary; avoid putting routing inside dumb components.
- **Presentational components** (`components/ui`, `components/charts`) receive **props only** — no hooks that hit the network (except purely local UI state). Keep them reusable and testable.
- **No duplicate business rules:** validation, aggregation, and authorization live on the **API**. The dashboard displays, filters, and submits; it does not re-implement KPI formulas that the backend already owns.
- **Auth:** Clerk wraps the app; tokens attach to API requests in the client layer, not scattered in every component.

**Anti-patterns to avoid:**

- `fetch` or axios calls inside random components instead of hooks + `lib/api`.
- Chart or table components that import Clerk or read env for API keys.
- Copy-pasting DTO types; prefer shared types generated or hand-maintained next to `lib/api` imports from a single module.
- Putting TanStack Query `useQuery` in leaf UI primitives shared across features (keeps data boundaries clear at page/feature level).

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

## Glossary

- **Tenant (org):** Clerk organization; selects which API tenant context the backend uses.
- **Server state:** Data from the API; prefer TanStack Query with stable query keys.
- **View model:** Shape optimized for charts/tables, derived from API DTOs in hooks or page-level mappers.
