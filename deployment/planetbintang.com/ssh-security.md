# SSH security

GitHub Pages does not provide shell SSH access to the web server. This applies only if you operate a separate VPS.

- Use an Ed25519 key and a non-root deployment account.
- Restrict inbound SSH in the firewall and keep the operating system updated.
- Test key-based login before disabling password login.
- Store private keys on the operator's device or a secret manager, never in Git.
- Do not publish SSH private keys, host private keys, or certificates in File Manager or the repository.
