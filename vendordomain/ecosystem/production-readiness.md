# VendorDomain production readiness checklist

## Repository / frontend
- [ ] All 500 feature registry IDs resolve to a feature page.
- [ ] Each feature manifest, REIC service contract and controller loads.
- [ ] Browser bundle contains no admin token, provider key or private credential.
- [ ] Frontend API base URL points to a deployed HTTPS endpoint.

## Backend / security
- [ ] Node.js 20+ runtime deployed behind HTTPS and a reverse proxy.
- [ ] `ADMIN_TOKEN` is a random secret with at least 32 characters; never shipped to the browser.
- [ ] `ALLOWED_ORIGIN` exactly matches the production origin.
- [ ] Rate limits, request-size limits and security headers verified.
- [ ] Operator authentication is replaced by user sessions and tenant-scoped RBAC before customer onboarding.
- [ ] Secrets are stored in a secret manager and rotated.

## Data / resilience
- [ ] PostgreSQL migration reviewed and applied in a controlled environment.
- [ ] Tenant isolation tests pass for every resource query and mutation.
- [ ] Automated backups and a successful restore drill are recorded.
- [ ] Audit events are append-only and retained according to policy.
- [ ] Metrics, structured logs, alerting and incident runbooks are active.

## Provider integrations
- [ ] Registrar, DNS, compute, storage, email and payment providers are selected individually.
- [ ] Sandbox credentials and contract tests pass.
- [ ] Idempotency, retry policy, rate limits and rollback procedures are documented.
- [ ] Billing ledger, tax handling and payment reconciliation are verified before charging customers.

## Release gate
- [ ] `npm test` passes in CI.
- [ ] Security review and dependency review complete.
- [ ] Staging smoke tests and rollback rehearsal complete.
- [ ] Production deployment is explicitly approved.
