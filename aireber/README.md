# AI Reber — GitHub Pages static adapter

This directory preserves the upstream `planetbintang/aireber` source and adds a browser-only adapter for the Planetbintang `.L` GitHub Pages site at `/.L/aireber/`.

## Page and source layout

- `index.html`, `reber.css`, and `reber-app.js` provide the standalone static interface. All page assets and navigation use paths relative to this project subdirectory, so the app works under GitHub Pages project-site prefixes.
- `assets/kata-data.js` and `assets/virtual-fs.js` are browser ES-module output transpiled from the matching TypeScript libraries in the archived source commit. They provide bounded, paginated virtual filesystem and word-catalog behavior without a server.
- `source/` contains the approved 33-file source snapshot from commit `b678639e87472214169740513108c85eb183cc39`; text/code/config/SQL/SVG files use a `.source.txt` suffix and are never imported by the adapter. `source-index.json` records original paths, sizes, and SHA-256 hashes.
- The original project material is also preserved in `src/`, `db/`, and other upstream paths. The upstream project used TanStack Start, Netlify AI Gateway, and Netlify Database; those services are not deployed or invoked by the Pages adapter.

## Static runtime boundaries

AI/model/API/server/database/deployment execution is inactive on GitHub Pages. The app does not execute archived source. Prompts, drafts, uploads, and project metadata are stored in browser IndexedDB under the `aireber/` namespace and can be browsed under File Manager → `/workspace/aireber`. This is local to the browser/device, can be removed by browser storage policies, is limited by device/browser quota, and does not sync across devices. The three visual themes are stored in local browser preferences. Project-domain labels are drafts only and are not registered domains.

The root `.nojekyll` marker preserves the static source and asset files during branch-based Pages publishing. No server activation or external AI request is part of this adapter.
