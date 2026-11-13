# CIP — Custom Infrastructure Panel

CIP is the infrastructure administration layer inside VendorDomain. It shares the existing PlanetBintang Hosting API, account identity, tenant boundary, PostgreSQL database, File Manager records and audit stream.

## Runtime flow

`Owner/Admin → VendorDomain session → Hosting API → /admin/cip/* → tenant-scoped PostgreSQL → File Manager REIC mirror + audit`

The browser calls the configured Hosting API base URL with the existing bearer session. CIP endpoints are under `/admin/cip/*` relative to the configured API base (normally `/api/hosting`).

## Module layout

- `registry.reic`: central index and module routing.
- `modules/{domain}/index.reic`: domain manifest, module IDs, slots and API mapping.
- `../cip-system.reic`: canonical architecture and capacity.
- `../cip-admin.reic`: dashboard menu and endpoint map.
- `../cip-admin.reicss`, `../cip-admin.reicjs`, `../cip-admin.reicg`: presentation, behavior and graph.
- `../backend/api/hosting/[...route].mjs`: authenticated API gateway and CIP read routes.

## Current integration boundary

The overview endpoint reports real database counts, tenant resources, File Manager entries, audit events and actual Node process uptime/RSS. Host CPU, disk, DNS propagation, mail queues, firewall state and provider health are not fabricated; they require host/provider adapters.

CIP routes are read-only. Server mutations remain disabled until provider adapters, role/scope policy, CSRF protection, validation, approval flow, audit and integration tests are implemented. Creating a service record is not the same as provisioning a real server, domain, DNS zone, mailbox, certificate or database.

## Scale and file strategy

The registry describes 12,000 logical module slots (120 shards × 100 slots). This is not a claim that 12,000 physical source files exist. Only tested, implemented modules should be materialized. This keeps repository size controlled and avoids empty placeholder files.

## Deploy

Deploy the existing Hosting API from `vendordomain/backend`, configure `DATABASE_URL` and exact `HOSTING_ALLOWED_ORIGINS`, apply migrations documented in `../backend/README.md`, and point VendorDomain's API base to the deployed `/api/hosting` URL. Verify `GET /health`, authenticated `GET /admin/cip/overview`, tenant isolation and audit data before enabling provider writes.
