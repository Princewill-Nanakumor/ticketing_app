# Testing

How to run and maintain tests for Helix (Next.js + Prisma ticketing app).

## Prerequisites

- Node.js 20+ (22+ recommended)
- npm
- Chromium for Playwright (`npx playwright install chromium` if missing)
- For integration / E2E: a reachable Postgres via `DATABASE_URL`, plus `AUTH_SECRET` and `ADMIN_EMAIL` in `.env`

## Current suite (approximate)

- **74** Vitest unit tests (IDs, schemas, rate limit, mocked auth/ticket/user actions).
- **4** Vitest integration tests (real Postgres; register → ticket → comment → close).
- **6** Playwright tests (happy-path ticket flow, bad login, axe on key pages).

Counts drift as tests are added; re-run `npm test` / `npm run test:integration` / `npm run test:e2e` for exact numbers.

## Testing strategy

Helix follows a layered approach suited to a server-action ticketing app (no REST surface):

- Unit tests verify pure helpers (ticket/user IDs, Zod schemas, admin email, login rate limit, priority CSS) and server actions. Unit tests mock Prisma, Next.js cookies/redirects, and Sentry to keep tests deterministic and independent of external services.
- Integration tests hit a real database for the core ownership flow, with cookies / redirect / flash mocked around the actions. They are intentionally separated from the default `npm test` command to keep the fast feedback loop for day-to-day development.
- Playwright E2E verifies high-value authenticated workflows: register → login → create ticket → comment → close, plus a bad-login path and axe-core accessibility on public and signed-in pages.

Business rules (authz, validation, soft-delete guards) are tested close to the server actions. E2E stays thin — one full ticket path, one auth failure, a11y — not exhaustive UI coverage.

There is no separate HTTP API layer to unit-test; data access goes through `app/actions/*`. Admin user management is covered in Vitest with mocks; a dedicated admin E2E (list / edit / soft-delete) is not wired yet. Pagination, search, attachments, and email notifications are not implemented, so they are not tested.

## CI

No GitHub Actions test workflow is wired yet. Planned: a `.github/workflows/test.yml` workflow on PRs / `main` that enforces style, types, unit tests, and E2E.

Prefer **separate jobs** (rather than one long combined script) so failures are easy to identify:

```text
lint → typecheck → vitest → playwright
```

Each job should run its own command:

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

Optional fourth / fifth jobs when DB secrets are available in CI:

```bash
npm run test:integration
```

Until CI exists, run locally before merging:

```bash
npm run lint && npm run typecheck && npm test && npm run test:e2e
```

Add `npm run test:integration` when Postgres is configured.

## Commands

```bash
# Unit tests (Vitest; no DB required)
npm test

# Watch mode
npm run test:watch

# Integration tests (real Postgres via DATABASE_URL)
npm run test:integration

# Playwright (starts/reuses local Next on :3000)
npm run test:e2e

# Playwright UI mode
npm run test:e2e:ui

# First-time / after Playwright upgrade — if browsers are missing
npx playwright install chromium
```

Vitest unit tests do not need Postgres. Unit tests mock Prisma, Next.js cookies/redirects, and Sentry to keep tests deterministic and independent of external services.

Integration tests require `DATABASE_URL` (and create disposable `*@helix-test.invalid` rows that are cleaned up afterward). They stay on `npm run test:integration` rather than `npm test` so everyday unit runs stay fast.

E2E starts Next via Playwright’s `webServer`, so it needs the same env as local dev (`DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`). It creates real users/tickets with `e2e.*@helix-test.invalid` emails.

Approximate local runtimes (machine-dependent; useful once CI exists):

| Suite | Typical duration |
| --- | --- |
| Vitest (`npm test`) | under 1 second |
| Integration (`npm run test:integration`) | ~5–12 seconds |
| Playwright (`npm run test:e2e`) | ~15–20 seconds |

If you see `Executable doesn't exist … chrome-headless-shell`, run `npx playwright install chromium` once.

## What’s covered

| Layer | Location | What is tested |
| --- | --- | --- |
| Ticket / user IDs | `lib/ticket-id.test.ts`, `lib/user-id.test.ts` | `XX#######` format, accept / reject |
| Admin helpers | `lib/admin.test.ts` | `ADMIN_EMAIL` normalize / match / unset |
| Rate limit | `lib/login-rate-limit.test.ts` | 5-fail lockout, clear, per email+IP |
| Priority CSS | `lib/utils.test.ts` | High / Medium / Low / fallback |
| Auth role helper | `lib/current-user.test.ts` | `isAdmin` |
| Auth Zod | `app/actions/auth-schema.test.ts` | Password rules, login / register schemas |
| Ticket Zod | `app/tickets/new/schema.test.ts` | Ticket + comment validation |
| User Zod | `app/actions/users-schema.test.ts` | Update-user role / optional password |
| Auth actions | `app/actions/auth.test.ts` | Register, login, rate limit, logout (mocked) |
| Ticket actions | `app/actions/tickets.test.ts` | Create / list scope / view / comment / close authz |
| User actions | `app/actions/users.test.ts` | Admin list, demote/delete guards, soft-delete |
| DB integration | `tests/integration/db-flow.integration.test.ts` | User → ticket → comment → close + unique email |
| Action integration | `tests/integration/actions.integration.test.ts` | Real DB through register / login / ticket actions |
| E2E ticket flow | `e2e/ticket-flow.spec.ts` | Register → login → create → comment → close; bad login |
| E2E a11y | `e2e/a11y.spec.ts` | axe-core (WCAG 2 A/AA) on home, login, register, tickets, new ticket; fails on serious / critical |

## Layout

- `vitest.config.mts` — Vitest runner (`e2e/**` excluded in config; integration excluded via the `npm test` script)
- `playwright.config.ts` — E2E runner (`e2e/`), webServer on `:3000` (override with `E2E_PORT`)
- `e2e/*.spec.ts` — Playwright specs
- `lib/**/*.test.ts`, `app/**/*.test.ts` — Vitest specs co-located with source
- `tests/integration/*.integration.test.ts` — real-DB Vitest specs (`npm run test:integration`)

## Not in git

Playwright output (`test-results/`, `playwright-report/`, `blob-report/`, `playwright/.cache/`) is gitignored. Don’t commit pass/fail dumps; re-run the commands above for current results.

Env files (`.env`, `.env.docker`) are gitignored — copy from `.env.example` and fill `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`.

## Planned

- GitHub Actions CI (`test.yml`: separate lint, typecheck, Vitest, and Playwright jobs; integration when secrets exist)
- Admin E2E: `/users` list → edit → soft-delete guards
- `closeTicket` / flash cookie edge cases once redirect-in-try/catch behavior is cleaned up
- When built: pagination / sort / filters, search, attachments, notification email (mocked send / failure / retry)
- Component tests for complex client widgets (priority select, close modal) with Testing Library if they grow
