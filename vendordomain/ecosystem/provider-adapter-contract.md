# VendorDomain provider adapter contract

A provider adapter must implement a small, testable boundary and must never be called directly from browser code.

## Required adapter interface

Each adapter should expose:
- `providerKey`: stable provider identifier.
- `capabilities()`: explicit supported operations and unsupported operations.
- `health()`: readiness state without exposing account identifiers or secrets.
- `validate(input)`: local validation before any remote request.
- `execute(operation, input, context)`: server-only operation with timeout, idempotency key, authorization context and audit correlation.
- `normalizeError(error)`: safe error code/message without tokens or raw provider payloads.

## Required controls

1. Credentials are read from server environment or a managed secret store only.
2. Validate tenant ownership and role permissions before every resource mutation.
3. Require idempotency keys for create/update/delete operations where supported.
4. Use strict request timeouts and bounded retries with exponential backoff; never retry non-idempotent operations blindly.
5. Record actor, tenant, action, resource, provider request ID, result and correlation ID in the audit trail. Redact secrets and personal data.
6. Add sandbox contract tests, rate limits, provider health checks and operational alerts.
7. Make destructive operations explicit and confirm the target resource before execution.

## Adapter maturity

A provider is not considered production-ready merely because an API key exists. It must pass sandbox tests, authorization tests, failure/retry tests, audit verification, backup/restore drills and a documented rollback procedure.
