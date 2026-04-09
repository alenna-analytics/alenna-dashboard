# alenna-analytics-dashboard

Vite + React dashboard for **Alenna Analytics**. Clerk sign-in, theme (light/dark), English/Spanish, and a welcome screen. Data and Shopify operations live in **alenna-analytics-api** (`alenna-api` folder).

## Prerequisites

- Node 20+
- [pnpm](https://pnpm.io/) 9+

## Setup

```bash
pnpm install
copy .env.example .env
```

Set `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_URL` (FastAPI base URL, e.g. `http://127.0.0.1:8000`).

## Scripts

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
```

## Routing

- `/` — sign-in (Clerk) or redirect to `/dashboard` when signed in
- `/dashboard` — authenticated shell with welcome message
