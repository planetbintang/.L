# Runtime control — planetbintang.com

## Active runtime target
The current target is GitHub Pages on repository `planetbintang/.L`, branch `io`, publishing folder `/` (root). It serves static HTML, CSS, JavaScript, JSON, and media files.

## Runtime capability matrix
- Browser runtime: client-side JavaScript runs in the visitor's browser.
- Build/deploy runtime: GitHub Actions runners execute workflows when triggered and permitted.
- Server runtime: not provided by GitHub Pages. Node.js/PHP/Python application servers, long-running workers, server-side APIs, databases, shell/SSH, and Nginx require a separate VPS or managed service.
- DNS and TLS: managed through the authoritative DNS provider and GitHub Pages Settings; repository files alone cannot activate them.

## Safe activation
1. In Settings → Pages, select branch `io` and folder `/(root)`.
2. Set custom domain `planetbintang.com`.
3. Configure the DNS records in `../dns-records.md` at the authoritative DNS provider.
4. Wait for DNS validation and certificate issuance, then enable Enforce HTTPS.
5. Run the DNS and HTTPS workflows and inspect their results.

Do not represent a documented/virtual runtime as an active server process. Never commit tokens, passwords, or private keys.