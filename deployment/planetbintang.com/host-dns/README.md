# Host and DNS control — planetbintang.com

## Hosting
GitHub Pages project site: repository `planetbintang/.L`, branch `io`, folder `/`.

## Required DNS at the authoritative DNS provider
A records for apex `@`:
- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

Optional AAAA records when IPv6 is intentionally supported:
- `2606:50c0:8000::153`
- `2606:50c0:8001::153`
- `2606:50c0:8002::153`
- `2606:50c0:8003::153`

CNAME: host `www` → `planetbintang.github.io`.

Do not remove MX/TXT records for email or unrelated services. If a DNS proxy/CDN is enabled, use the provider's recommended mode during domain validation. DNS records are not changed by committing this document; use the actual registrar/DNS dashboard or an authorized DNS API integration.

## Verification
Run `.github/workflows/domain-dns-check.yml` or `deployment/planetbintang.com/verify-domain.sh`. DNS success alone does not prove Pages custom-domain settings or TLS are active.