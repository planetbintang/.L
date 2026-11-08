# VMDESKTOPREIC · OpenCode Shell Agent

This fixed-purpose local agent lets the VMDESKTOPREIC interface request the official OpenCode CLI installer on the same Linux/macOS machine.

## Start

Requirements: Node.js 18+, bash, curl, and internet access.

```bash
node opencode-shell-agent.mjs
```

Keep the process running, open https://planetbintang.github.io/.L/vmdesktopreic/, and choose **OpenCode** in the desktop. Select **INSTALL OPENCODE**. The agent runs only this fixed command:

```bash
curl -fsSL https://opencode.ai/v2/install | bash
```

It then verifies the installation with `opencode --version`.

## Security and limits

- Listens only on 127.0.0.1:43821; it is not a public network server.
- Accepts requests only from https://planetbintang.github.io.
- Exposes only health and the fixed OpenCode install action; it does not accept arbitrary shell text.
- Run it only on a machine you administer. Review the official installer before running it if you need a manual audit.
- GitHub Pages itself cannot execute shell commands. This local agent supplies the OS process runtime on the machine where it is started.
