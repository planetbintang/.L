# TLS / SSL certificate

## GitHub Pages
1. Set the custom domain in Settings → Pages.
2. Apply the DNS records from `dns-records.md`.
3. Wait for GitHub to issue the certificate.
4. Enable **Enforce HTTPS** after it becomes available.

## Self-managed VPS
Use an ACME client such as Certbot to obtain and renew the certificate. Configure Nginx's 443 listener and HTTP-to-HTTPS redirect only after the certificate paths are valid. Monitor renewal.

Never commit private keys, access tokens, or private certificate material to this repository.
