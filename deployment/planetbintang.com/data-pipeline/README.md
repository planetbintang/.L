# Data pipeline — domain activation

This pipeline describes the verifiable release flow for `planetbintang.com`; it does not fabricate live status.

1. Source: commit site files to branch `io`.
2. Validation: review changed files, confirm root `CNAME` equals `planetbintang.com`, and check links/assets.
3. Publish: GitHub Pages builds/publishes the selected branch and root folder when Pages is configured.
4. DNS validation: workflow `Domain DNS Check` checks apex A records and `www` CNAME.
5. HTTPS validation: workflow `Domain HTTP(S) Health Check` checks both public HTTPS hosts.
6. Manual control-plane validation: verify Settings → Pages custom domain, publishing source, and certificate status.
7. Completion: mark domain active only after DNS, Pages configuration, and HTTPS are all verified.

## Outputs
- Git commit / SHA for source changes.
- GitHub Actions logs for DNS and HTTPS checks.
- Manual confirmation of Pages settings and TLS certificate.

## Failure handling
If a check fails, preserve logs, fix the authoritative DNS/Pages configuration, wait for propagation, and rerun checks. Never store registrar credentials in the repository. See `../activation-stack/README.md`.