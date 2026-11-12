# VendorDomain API (production service scaffold)

This API provides **persistent server-side records**, domain-name format validation, audit events, and optional **live Cloudflare DNS changes**. It replaces browser-only mock actions with real HTTP endpoints. It does not register/purchase domains at a registrar.

## Deploy

Requires Node.js 20+. Deploy this directory to a trusted server/container with persistent disk. GitHub Pages is static hosting and cannot run this Node server.

1. Copy `.env.example` to a secret-managed environment (do not commit real credentials).
2. Set a long random `ADMIN_TOKEN`, `ALLOWED_ORIGIN` to the exact site origin, and a persistent writable `DATA_DIR`.
3. For live DNS management, create a narrowly scoped Cloudflare API token with DNS edit/read permissions for the intended zone; set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID`.
4. Run `npm start` behind HTTPS and a reverse proxy. Restrict access, configure backups/monitoring, and rotate credentials.
5. Configure the frontend API base URL to the deployed HTTPS API URL. Never expose the admin token in browser JavaScript; the authenticated admin API should be called by a trusted server-side session/proxy.

## Account identity and tenant workspace

The account API adds register/login, profile settings, password changes, tenant-scoped domain inventory, File Manager metadata references, member-role management, and an account activity trail.

- `POST /api/auth/register` — create an active account, a private workspace, and the initial owner membership.
- `POST /api/auth/login` — authenticate by email and password.
- `GET /api/auth/me`, `POST /api/auth/logout` — inspect or revoke the current bearer session.
- `GET /api/account/overview` — workspace metrics and recent activity.
- `GET/PUT /api/account/profile` — read or update profile fields.
- `POST /api/account/password` — verify the current password and change it.
- `GET/POST /api/account/domains` — tenant-scoped domain inventory (not a registrar purchase).
- `GET/POST /api/account/files` — tenant-scoped File Manager metadata and path references. This does not upload file bytes.
- `GET /api/account/members`, `PUT /api/account/members/:id/role` — view workspace members and change non-owner roles when authorized.

Passwords are hashed with Node.js scrypt and a per-user random salt. Only SHA-256 hashes of random session tokens are persisted; raw session tokens are returned once at login/register. Sessions expire after 30 days. Login and registration share an additional per-IP attempt limit. User-facing account routes require the session bearer token; existing administrative endpoints continue to require the server-only ADMIN_TOKEN. Account records are isolated by tenant ID.

Register currently activates an account immediately and does not send email verification or password-reset email. Add a verified email delivery flow, recovery process, MFA, and operational abuse controls before opening public registration broadly. The current JSON-file backend is single-instance only; use the PostgreSQL migration below for a multi-instance production deployment.

Apply `migrations/002_account_identity.sql` after backing up and reviewing the database. It adds password/profile fields, session records, and a File Manager metadata registry. Existing user rows are not assigned passwords automatically.

## Endpoints

- `GET /health` — service and integration readiness.
- `POST /api/domain/validate` — syntactic domain validation (no registrar availability check).
- `GET/POST /api/records`, `PUT/DELETE /api/records/:id` — persistent application records, protected by bearer token.
- `GET /api/audit` — recent audit events, protected.
- `GET/POST /api/dns/records`, `DELETE /api/dns/records/:id` — live Cloudflare DNS operations, protected.
- `GET/POST /api/sales`, `GET /api/sales/:id` — sales-order ledger, protected.
- `POST /api/sales/:id/confirm`, `/fulfill`, `/payments`, `/cancel` — guarded sales-state transitions and manual receipt entries, protected.
- `GET /api/sales/summary` — IDR order pipeline, recognized revenue, recorded cash, receivables, customer advances, cost of goods sold and gross profit, protected.

All `/api/*` endpoints except domain-format validation require `Authorization: Bearer <ADMIN_TOKEN>`. Use HTTPS. Configure Cloudflare least-privilege credentials and verify the target zone before issuing changes. A successful DNS request changes the real zone.

## Sales ledger and asset treatment

The sales ledger is an internal operational register, not a payment processor, inventory system, tax engine or statutory financial statement. Create an order with a customer label and line items containing `name`, integer `quantity`, integer `unitPrice` and integer `unitCost`; all money values are whole rupiah (IDR), before tax and discounts. New orders start as `draft`, then move through `confirmed` and `fulfilled`; unfulfilled orders do not count as recognized revenue in this ledger.

The summary deliberately separates concepts: **recognized revenue is income, not an asset**. Recorded cash receipts and receivables on fulfilled orders are shown as sales-related assets. A payment recorded before fulfillment is cash received with an offsetting customer-advance liability; it is not counted as revenue until the order is marked fulfilled. Cost of goods sold and gross profit use the unit-cost values entered with each order. Receipts are manual ledger entries only: no bank, card, wallet, registrar or payment-provider transaction is initiated or independently verified.

Example requests (replace the URL and use the token only from a trusted operator environment; never put it in a static browser page):

```sh
curl -X POST "$API_BASE/api/sales" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"customer":"Pelanggan A","currency":"IDR","items":[{"name":"Paket layanan","quantity":2,"unitPrice":120000,"unitCost":40000}]}'
```

Use the returned sale ID for `POST /api/sales/{id}/confirm`, then record a manual payment with `POST /api/sales/{id}/payments` and body `{"amount":100000,"reference":"bank-reference"}`. Mark fulfillment using `POST /api/sales/{id}/fulfill`; read the calculated figures from `GET /api/sales/summary`. A canceled or fulfilled sale is not deleted, payments cannot exceed the order total, and a paid order cannot be canceled without a separate refund procedure.

This simplified recognition point is a system workflow choice, not accounting advice or a guarantee of compliance with Indonesian tax rules, PSAK, IFRS or another reporting framework. Confirm recognition, tax, returns/refunds, inventory, evidence of delivery, permissions and retention rules with the responsible accountant before production use.

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
