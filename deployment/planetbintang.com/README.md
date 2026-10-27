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
