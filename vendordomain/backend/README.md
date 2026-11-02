# VendorDomain API (production service scaffold)

This API provides **persistent server-side records**, domain-name format validation, audit events, and optional **live Cloudflare DNS changes**. It replaces browser-only mock actions with real HTTP endpoints. It does not register/purchase domains at a registrar.

## Deploy

Requires Node.js 20+. Deploy this directory to a trusted server/container with persistent disk. GitHub Pages is static hosting and cannot run this Node server.

1. Copy `.env.example` to a secret-managed environment (do not commit real credentials).
2. Set a long random `ADMIN_TOKEN`, `ALLOWED_ORIGIN` to the exact site origin, and a persistent writable `DATA_DIR`.
3. For live DNS management, create a narrowly scoped Cloudflare API token with DNS edit/read permissions for the intended zone; set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID`.
4. Run `npm start` behind HTTPS and a reverse proxy. Restrict access, configure backups/monitoring, and rotate credentials.
5. Configure the frontend API base URL to the deployed HTTPS API URL. Never expose the admin token in browser JavaScript; the authenticated admin API should be called by a trusted server-side session/proxy.

## Endpoints

- `GET /health` — service and integration readiness.
- `POST /api/domain/validate` — syntactic domain validation (no registrar availability check).
- `GET/POST /api/records`, `PUT/DELETE /api/records/:id` — persistent application records, protected by bearer token.
- `GET /api/audit` — recent audit events, protected.
- `GET/POST /api/dns/records`, `DELETE /api/dns/records/:id` — live Cloudflare DNS operations, protected.

All `/api/*` endpoints except domain-format validation require `Authorization: Bearer <ADMIN_TOKEN>`. Use HTTPS. Configure Cloudflare least-privilege credentials and verify the target zone before issuing changes. A successful DNS request changes the real zone.

## Limitations and safety

- No registrar purchase/renewal, billing, user login, or domain transfer is implemented without a selected registrar/payment/auth provider.
- Browser pages must not contain `ADMIN_TOKEN` or Cloudflare secrets. Use a server-side session or secure proxy for real user-facing access; do not place admin secrets in static JavaScript.
- JSON-file storage suits a single instance only. For multi-instance/high-availability production, use PostgreSQL or another managed database and add migrations/backups.
- This repository contains source code, not a deployed server. The live API is not active until deployed and configured with secrets.


## Security and ecosystem hardening

The API now applies:
- minimum 32-character configured admin token (short configured values stop startup);
- exact-origin CORS allow-list when `ALLOWED_ORIGIN` is configured;
- per-IP fixed-window rate limiting for API routes (`RATE_LIMIT_MAX`, default 120/minute);
- bounded request bodies measured in bytes;
- request IDs, no-store responses, security headers, and sanitized internal-error responses;
- serialized atomic file writes to reduce partial-write and overlapping-write risk.

Run automated integration tests with `npm test`. The tests use a temporary data directory and do not connect to a real DNS provider.

## Next production boundary

This single-process JSON-file backend is a development/single-instance foundation. Before multi-user production, replace file persistence with the PostgreSQL migration in `migrations/001_core.sql`, add user/session identity and tenant-scoped RBAC, managed secrets, backups, metrics, alerting, and provider-specific integration tests. Do not share the global admin token with static browser pages.
