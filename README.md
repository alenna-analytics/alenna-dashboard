# ecommerce-analytics-dashboard

React + Vite + TypeScript frontend for ecommerce analytics. Use **pnpm** only (see `packageManager` in `package.json`). Conventions: `CLAUDE.md`.

## Prerequisites

- [Node.js](https://nodejs.org/) LTS
- [pnpm](https://pnpm.io/installation) 9.x (or enable Corepack: `corepack enable`)

## Setup

```bash
pnpm install
```

Copy `.env.example` to `.env.local` and set **`VITE_CLERK_PUBLISHABLE_KEY`** from the [Clerk Dashboard](https://dashboard.clerk.com/) (API keys). Local dev should use `.env.local` (gitignored). Optionally set **`VITE_API_URL`** (default in `.env.example` is `http://localhost:8000`).

Clerk React setup follows the official quickstart: [Clerk + React (Vite)](https://clerk.com/docs/react/getting-started/quickstart).

For local sign-in, add **`http://localhost:5173`** under **Allowed redirect URLs** and **Allowed origins** (or your dev URL) in the Clerk Dashboard so redirects and session tokens match your app.

### Multi-tenant session (no Clerk Organizations)

Tenancy is in **our** database. The active company is stored on the Clerk user as **`publicMetadata.active_tenant_id`** (UUID string) and **`publicMetadata.active_role`** (`staff` \| `admin` \| `super_admin`). After choosing a company, **`POST /me/active-tenant`** (via `useTenantSwitcher`) validates membership and the **API** updates Clerk `public_metadata` with the Backend API (the browser cannot PATCH `public_metadata` on Clerk API v2025+). Ensure **`CLERK_SECRET_KEY`** is set in the FastAPI `.env`. Then `user.reload()` and `getToken({ skipCache: true })` pick up the new session claims.

In the Clerk Dashboard, customize the **session token** so the API receives claims (names match the backend):

```json
{
  "org_id": "{{user.public_metadata.active_tenant_id}}",
  "role": "{{user.public_metadata.active_role}}"
}
```

Use wrapper hooks (`useCurrentUser`, `useCurrentTenant`, `useTenantSwitcher`) from `src/auth/hooks.ts` so components do not import Clerk APIs directly.

## Scripts

```bash
pnpm dev
pnpm build
pnpm lint
pnpm preview
```

## Package manager

Do not use `npm install` or `yarn`; the lockfile is `pnpm-lock.yaml`.
