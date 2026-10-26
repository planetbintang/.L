# Vendor Domain Dashboard

A static GitHub Pages dashboard at `/vendordomain/` for a 500-feature vendor/domain management catalogue.

## Files
- `index.html`: dashboard, top navigation, four dropdown menus, module sidebar, searchable feature blocks, and text-to-HTML studio.
- `vendor.css`: responsive layout and light/dark themes.
- `vendor.js`: 20 modules with exactly 25 named features each, interactive filtering, pagination, feature detail dialog, CSV export and HTML download preview.

## Published URL
https://planetbintang.github.io/.L/vendordomain/

## Integration status
The catalogue and front-end interactions work as a static prototype. Live domain registration, registrar account changes, DNS updates, TLS issuance, billing, hosting deployment and other privileged actions require secure server-side API integrations. Do not put registrar tokens, API secrets or private keys in client-side JavaScript. The text studio exports HTML; a public site requires uploading the generated HTML to hosting and pointing a domain to that service.
