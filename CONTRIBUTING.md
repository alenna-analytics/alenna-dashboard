# Contributing

## Branches

Use one of these patterns:

- `main`, `master`, `develop` (protected integration branches as your team defines them)
- `feature/<short-description>` — new functionality
- `fix/<short-description>` — bug fixes
- `chore/<short-description>` — tooling, deps, housekeeping
- `docs/<short-description>` — documentation only
- `release/<version>` — release preparation
- `hotfix/<short-description>` — production hotfixes

A `pre-push` hook rejects other branch names.

## Commits

Messages follow [Conventional Commits](https://www.conventionalcommits.org/) (enforced by Commitlint on `git commit`):

- `feat: add sales chart to dashboard`
- `fix: correct loading state on filters`
- `chore: bump eslint`
- `docs: update README`

Use `feat!:` or `BREAKING CHANGE:` in the footer for breaking changes.

## Git hooks (Husky)

After cloning, install dependencies so Husky runs `prepare`:

```bash
pnpm install
```

Hooks:

- **pre-commit** — ESLint with `--fix` on staged `*.ts` / `*.tsx` (lint-staged).
- **commit-msg** — Commitlint (conventional commits).
- **pre-push** — Valid branch name, then full-project `pnpm lint` and `pnpm run typecheck`.

The API repo uses **pre-commit** (Python) instead of Husky; branch and commit conventions match this file.
