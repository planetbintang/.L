# REIC BIOS Registry

BIOS Registry uses the Aireber server database through the REIC Table schema. It is not backed by browser Local Storage.

## Tables

- `bios_devices`: unique Serial Number, device label, server-side password hash and salt, role, status and login timestamps.
- `bios_sessions`: hashed opaque session token, device relation, expiry and revocation.
- `bios_audit`: registration, login, logout, status changes and device deletion history.

Migration: `netlify/database/migrations/20261112090000_create_bios_registry/migration.sql`.

## API

The TanStack Start route is `/api/bios`.

- `GET /api/bios?action=health`
- `POST /api/bios` with `action=register`, `login`, `logout`, `set-device-status` or `delete-device`
- `GET /api/bios?action=me`
- `GET /api/bios?action=devices`
- `GET /api/bios?action=audit`

Passwords are derived server-side with PBKDF2-HMAC-SHA512 (210,000 iterations). Only the hash and random salt are stored. Session tokens are random, stored as SHA-256 digests, issued in Secure, HttpOnly cookies and expire after eight hours.

## Deployment configuration

Set these environment variables in the Aireber Netlify site before deploying:

- `BIOS_ADMIN_SERIALS`: comma-separated Serial Numbers that are permitted to register as administrators. Set this before registering the owner/admin device. Never assign admin role from browser input.
- `BIOS_ALLOWED_ORIGINS`: comma-separated exact browser origins. Default: `https://planetbintang.github.io`. Include any other trusted production origin explicitly.

The VMDESKTOPREIC GitHub Pages client can point to the deployed Aireber origin by setting this before `bios-auth.js` loads:

```html
<meta name="reic-api-base" content="https://YOUR-AIREBER-HOST">
```

Replace the example host with the real deployed Aireber URL. Do not publish credentials in this setting. The API must be deployed with its database migration applied and must use HTTPS. Cross-site cookies may be restricted by some browsers; a same-site reverse proxy/custom domain is the preferred production arrangement.

## Operational notes

GitHub Pages is static hosting and does not execute this database API. The REIC BIOS API must be deployed from the `aireber` application to its server host. The browser client deliberately does not fall back to Local Storage when the database API is unavailable.
