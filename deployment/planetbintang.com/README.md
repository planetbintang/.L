# planetbintang.com → Planetbintang .L

Target site: https://planetbintang.github.io/.L/

The repository root contains `CNAME` with `planetbintang.com`. This declares the GitHub Pages custom domain when the repository is published from a branch. It does **not** change DNS at the registrar and does not enable GitHub Pages settings automatically.

## GitHub Pages
1. Open repository Settings → Pages and confirm the publishing source is the `io` branch / correct folder.
2. Set custom domain to `planetbintang.com` and save.
3. At the DNS provider, configure the records in `dns-records.md`.
4. Wait for DNS and certificate issuance, then enable Enforce HTTPS in Settings → Pages.
5. Test both `https://planetbintang.com/` and `https://www.planetbintang.com/`.

GitHub Pages is static hosting: it does not run Nginx, provide a web-server SSH shell, or manage email mailboxes. The Nginx and SSH files here are templates for a separate VPS only.


## Domain Control Center

- Main hostname: `https://planetbintang.com/`
- www hostname: `https://www.planetbintang.com/`
- Publishing branch: `io`, directory `/`
- Root `CNAME` must contain exactly `planetbintang.com`.

### Activation order
1. Open https://github.com/planetbintang/.L/settings/pages.
2. Select Deploy from a branch → branch `io` → folder `/(root)` and save.
3. Set the custom domain to `planetbintang.com` and save.
4. At the authoritative DNS provider, configure the four apex A records in `dns-records.md` and `www CNAME -> planetbintang.github.io`.
5. Run `Domain DNS Check` and `Domain HTTP(S) Health Check` from the repository Actions tab.
6. Enable Enforce HTTPS only after GitHub Pages reports the certificate is ready.

### Operational boundaries
This repository and its workflows can inspect DNS and HTTP(S); they cannot change registrar DNS or GitHub Settings → Pages without an authorized provider integration. GitHub Pages is static hosting: it does not run Nginx, SSH, PHP, Node servers, or databases. File Manager templates for those services are documentation, not active server processes.

Never commit registrar passwords, access tokens, private keys, or other secrets.
