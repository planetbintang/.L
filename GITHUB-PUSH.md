# GitHub Push in File Manager

The File Manager includes an optional GitHub Contents API editor to load and commit a text/code file directly to a selected repository and branch.

## Setup
1. Create a GitHub Personal Access Token (fine-grained is preferred) with access to the target repository and **Contents: Read and write** permission.
2. Open **Code → File Manager** and enter the token in the GitHub Push panel. The token is held in the current browser tab's `sessionStorage`; do not use this on a shared or untrusted device.
3. Select a repository, branch, and file path, then choose **Muat dari GitHub**.
4. Edit the text and click **Push ke GitHub**. The UI asks for confirmation before manual commits.
5. Optional: enable **Auto-push**. After a loaded file is edited, the page waits four seconds after typing stops and commits the changed content. Auto-push is off by default and asks for confirmation when enabled.

## Important limitations
- GitHub Pages is a static site and cannot securely store a write credential on a server. This implementation sends the token from the browser directly to `api.github.com`; no Planetbintang backend or proxy is used.
- The token is not written to localStorage or the repository. Clearing the token field removes it from sessionStorage. Never paste a token into code, a commit message, or a public issue.
- Give the token the minimum repository access needed. Fine-grained tokens should be limited to the chosen repository with Contents read/write permission.
- The File Manager's tree is metadata-only. It does not download source contents automatically; use the explicit load action before editing.
- Commits are real GitHub writes. Review the repository, branch, path, and content carefully. Branch protection, organization policies, token permissions, rate limits, and GitHub API errors can block a push.
- Binary files are not supported by the editor; this panel is intended for text and source code. Use the Media Library for local media assets.
