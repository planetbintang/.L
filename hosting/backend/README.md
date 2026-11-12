# Hosting REIC Backend API

Vercel Functions + PostgreSQL (Neon Marketplace). Backend ini melayani akun, sesi, profil, layanan, audit, metadata File Manager, dan domain dalam isolasi tenant.

## Required environment variables
- `DATABASE_URL`: Neon pooled PostgreSQL connection string. Store as an encrypted Vercel environment variable, never commit it.
- `ALLOWED_ORIGINS`: comma-separated exact frontend origins, e.g. `https://planetbintang.github.io`.

## Deploy
Vercel project root directory: `hosting/backend`; runtime Node.js 20+.
Apply `../database/001_hosting_identity.sql` to the Neon database before enabling traffic.
Run `npm install` and deploy. Health endpoint: `/api/hosting/v1/health`.

## Security and limitations
- Passwords are scrypt-hashed; session identifiers are random, SHA-256 hashed in database, and delivered only in HttpOnly Secure SameSite cookies.
- Tenant ID is always derived from the verified session; client cannot select a tenant.
- API validates exact Origin for cross-site requests. Set ALLOWED_ORIGINS to the frontend origin.
- File Manager endpoint manages metadata only. Actual binary upload/download requires private object storage integration and signed URLs; do not expose object storage credentials to the browser.
- Registration currently creates an active owner account without email verification. Add a mail provider and verification flow before public launch.
- Apply PostgreSQL row-level security and production rate limiting before public launch. Keep DATABASE_URL and all secrets in Vercel environment settings.
