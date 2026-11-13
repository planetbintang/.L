# PlanetBintang Hosting API

Server-side API for Hosting Account Center. Deploy as a Vercel Node.js Function from root directory `vendordomain/backend` using PostgreSQL (Neon).

## API surface

Base path: `/api/hosting`
- `GET /health` — database and migration readiness.
- `POST /auth/register`, `POST /auth/login` — create account/workspace or issue a session.
- `GET /auth/me`, `POST /auth/logout` — inspect or revoke a bearer session.
- `GET /account/overview` — service, file and activity metrics.
- `GET/PUT /account/profile` — profile data mirrored to File Manager.
- `POST /account/password` — change password and revoke other sessions.
- `GET/POST /services`, `PUT/DELETE /services/:id` — tenant-scoped hosting resources.
- `GET/POST /files`, `GET/PUT/DELETE /files/:id` — tenant-scoped File Manager REIC records.
- `GET /activity` — account audit stream.\n- `GET /admin/cip/overview` — authenticated Owner/Admin infrastructure overview.\n- `GET /admin/cip/{accounts|packages|domains|dns|email|files|databases|security|backups|webserver|services|integrations|applications|settings|logs}` — tenant-scoped CIP module data.\n\nCIP routes share the same `/api/hosting` API base, bearer session, tenant membership and PostgreSQL tables. Mutating CIP operations return HTTP 405 until a real provider adapter, approval flow and security checks are configured.

Service records are mirrored to `file_manager_entries` under `hosting/accounts/services/{tenant-id}/{service-id}.reic`. Profile records are mirrored under `hosting/accounts/profiles/{user-id}.reic`. This is a database-backed File Manager namespace, not browser IndexedDB.

## Database setup

The Vercel team has a Neon integration available. Create/select a PostgreSQL database and set `DATABASE_URL` as a Vercel Secret for Production and Preview. Apply migrations in order:
1. `migrations/001_core.sql`
2. `migrations/002_account_identity.sql`
3. `migrations/003_hosting_workspace.sql`

`002_platform_modules.sql` is a separate platform migration and is not required by this Hosting API. Do not apply both files named `002` as a numeric sequence.

## Vercel environment

- `DATABASE_URL` — Neon/PostgreSQL pooled connection string; Secret.
- `HOSTING_ALLOWED_ORIGINS` — comma-separated exact origins. Production default: `https://planetbintang.github.io`.

Never expose database credentials, admin tokens, or provider secrets in browser JavaScript.

## Deploy

Create/link a Vercel project for repository `planetbintang/.L`, root directory `vendordomain/backend`, production branch `io`. The function is `api/hosting/[...route].mjs`; public endpoint path is `/api/hosting/*`.

After adding `DATABASE_URL` and applying migrations, verify health, registration, session, service creation, REIC file mirroring, authenticated `/admin/cip/overview`, Owner/Admin access control and cross-tenant isolation. Set the VendorDomain frontend API base to the deployed URL ending in `/api/hosting`.

## Security and boundaries

- Passwords use Node.js scrypt with unique random salt.
- Session tokens are random 256-bit values; only SHA-256 token hashes are persisted.
- API operations are tenant-scoped and writes check membership role.
- Request body limit: 1 MiB; REIC file content limit: 512 KiB.
- Exact-origin CORS allow-list. Add rate limiting, email verification, password recovery, MFA and abuse monitoring before broad public registration.
- File Manager stores text/REIC records and metadata in PostgreSQL. Binary uploads and actual website hosting require a separate object-storage and deployment adapter.
- Registration creates an account and workspace; it does not provision a domain, DNS zone, VM, database service, mail server or hosting container.
