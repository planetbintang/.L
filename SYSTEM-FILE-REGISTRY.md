# System File Registry

This registry is the machine-readable index for main-screen routes and the source files that implement them.

- Registry data: [data/system-registry.json](./data/system-registry.json)
- Browser loader and navigation integration: [system-registry.js](./system-registry.js)
- Main navigation and view shell: [index.html](./index.html), [system-navigation.js](./system-navigation.js)
- File Manager: [file-manager.js](./file-manager.js)
- Repository catalog: [dashboard.js](./dashboard.js), [data/repositories.json](./data/repositories.json)

## Contract

Each route record has a stable `id`, human-readable `label`, navigation `route`, `group`, repository-relative `sourceFiles`, `capabilities`, and explicit `executionState`. The browser loader validates the schema and unique IDs, attaches registry IDs to matching `data-system-route` links, and exposes `window.PBSystemRegistry` with `get()`, `list()`, `sourceUrl()`, and `validate()`.

The registry is the index for route-to-code ownership and source links. It does not execute code from those links. A source link opens the corresponding file on GitHub branch `io`. Local workspace content and browser preferences remain local unless an authenticated backend is separately connected.

## Operational boundaries

GitHub Pages serves static files. A registry entry does not mean a runtime, DNS change, database, CI job, AI provider, shell, or deployment service is active. The `executionState` field distinguishes browser features, snapshots, external provider links, local storage, and systems requiring a backend/provider. Do not store secrets in this public file.
