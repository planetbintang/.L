# VendorDomain Ecosystem Blueprint

The platform is organized around independently versioned service domains. The service catalog is a capability map, not a claim that all providers are connected.

## Runtime boundaries
- Static GitHub Pages frontend: interface, public catalog, feature bundles.
- Node.js API: authenticated server operations, validation, records, audit and provider adapters.
- PostgreSQL: tenant-aware persistent production data (migration provided).
- Provider adapters: registrar, DNS, compute, storage, email and payment; each requires credentials and contract tests.
- Observability: request IDs, structured logs, metrics, health checks and alerting.

## Event contract
All future asynchronous service integrations should publish the versioned envelope in `event-envelope.schema.json`. Use idempotency keys for provider mutations, correlation IDs across service boundaries, and append-only audit records.

## Multi-tenant production gate
Before enabling customer access, implement an identity/session provider, tenant-scoped RBAC checks on every resource query, CSRF protection for cookie sessions, secret management, PostgreSQL migrations, backup/restore drills, rate limits per tenant and per credential, and provider sandbox tests. The existing admin-token API is an operator scaffold, not customer authentication.

## Capability status
See `service-catalog.json`. `foundation` means repository contracts or scaffolding exist; `partial` means a limited adapter exists; `planned` means provider implementation is still required.
