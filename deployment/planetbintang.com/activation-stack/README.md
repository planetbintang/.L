# Domain activation stack — planetbintang.com

This folder documents the complete control stack. Each control plane has a separate authority; File Manager is the inventory/control surface, not a substitute for provider permissions.

| Layer | Responsibility | Where it is actually activated |
|---|---|---|
| Source | Site files and root CNAME | Git repository branch `io` |
| Build/deploy | Publish static site | GitHub Pages Settings and deployment status |
| Runtime | Browser JavaScript and static assets | Visitor browser; server-side runtime needs separate hosting |
| Domain binding | Associate custom domain | Repository Settings → Pages |
| DNS | Resolve apex and `www` | Authoritative registrar/DNS provider |
| TLS/HTTPS | Certificate and HTTPS enforcement | GitHub Pages after DNS validation and certificate issuance |
| Monitoring | DNS and HTTPS checks | GitHub Actions workflows and their logs |
| Security | Least privilege, secrets, DNS integrity | GitHub/provider account settings; never commit credentials |
| Verification | Confirm public behavior | Actions logs, Pages settings, and live HTTPS tests |
| Email (optional) | MX/SPF/DKIM/DMARC | Email provider's official DNS values only |
| Server runtime (optional) | Node/PHP/Python, DB, Nginx, SSH | Separate VPS/managed application host, not GitHub Pages |

## Activation checklist
- [ ] Branch `io` and folder `/(root)` selected in Settings → Pages.
- [ ] Custom domain `planetbintang.com` saved in Settings → Pages.
- [ ] Four apex A records configured at authoritative DNS.
- [ ] `www` CNAME points to `planetbintang.github.io`.
- [ ] DNS check workflow passes.
- [ ] GitHub Pages certificate is ready and Enforce HTTPS is enabled.
- [ ] Both `https://planetbintang.com/` and `https://www.planetbintang.com/` return a valid page over trusted HTTPS.
- [ ] Only then update `activation-status.json` from actual evidence.

The GitHub connection available for repository commits cannot directly write registrar DNS or the Pages settings page. Do not claim the domain is active until external controls have been verified.