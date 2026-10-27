# DNS records for planetbintang.com on GitHub Pages

These are the records to enter at the DNS provider that is authoritative for `planetbintang.com`. Saving this file in GitHub does **not** publish DNS records by itself.

## 1. Add the domain in GitHub first

In repository `planetbintang/.L`, open **Settings → Pages** and set **Custom domain** to `planetbintang.com`. Confirm the publishing source points at the `io` branch and the correct folder. The repository root already has a `CNAME` file containing only `planetbintang.com`.

## 2. DNS records

At the domain registrar / DNS host, add all four apex `A` records:

| Type | Host / Name | Value | TTL |
|---|---|---|---|
| A | @ | 185.199.108.153 | Default / 3600 |
| A | @ | 185.199.109.153 | Default / 3600 |
| A | @ | 185.199.110.153 | Default / 3600 |
| A | @ | 185.199.111.153 | Default / 3600 |

For IPv6, add all four `AAAA` records if your DNS provider and intended visitors support IPv6:

| Type | Host / Name | Value |
|---|---|---|
| AAAA | @ | 2606:50c0:8000::153 |
| AAAA | @ | 2606:50c0:8001::153 |
| AAAA | @ | 2606:50c0:8002::153 |
| AAAA | @ | 2606:50c0:8003::153 |

Add `www` as a CNAME pointing directly to the account's GitHub Pages host (not the project path):

| Type | Host / Name | Value |
|---|---|---|
| CNAME | www | planetbintang.github.io |

If the DNS provider uses a proxy/CDN toggle, temporarily set these records to DNS-only while GitHub validates the domain and issues HTTPS. Do not create wildcard (`*`) records. Remove conflicting old website records only after confirming they are not needed by another service.

## 3. Verify DNS

After saving the records, allow time for DNS propagation (it can take up to 24 hours). Run these commands on a computer with `dig` installed:

```sh
dig planetbintang.com A +short
dig planetbintang.com AAAA +short
dig www.planetbintang.com CNAME +short
```

The A lookup should return the four IPv4 addresses above. If you created AAAA records, that lookup should return the four IPv6 addresses. The www CNAME should return `planetbintang.github.io.`.

## 4. HTTPS

Once DNS resolves correctly and GitHub Pages has issued the certificate, go to **Settings → Pages** and enable **Enforce HTTPS**. Then test:

- https://planetbintang.com/
- https://www.planetbintang.com/
- https://planetbintang.github.io/.L/

If HTTPS is unavailable, do not add unrelated A/AAAA records; check the GitHub Pages custom-domain and certificate status first.

## Email

Do not add guessed MX, SPF, DKIM, or DMARC values. Those depend on the actual email provider and must be obtained from that provider; website A/CNAME records do not create mailboxes.

Official instructions: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
