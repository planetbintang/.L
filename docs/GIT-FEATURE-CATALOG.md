# Git Feature Catalog — OS MEDIA VM / REIC

## Entry point
- UI: [git-feature-catalog.html](../git-feature-catalog.html)
- Styles: [git-feature-catalog.css](../git-feature-catalog.css)
- Behavior: [git-feature-catalog.js](../git-feature-catalog.js)
- Data: [data/git-feature-catalog.json](../data/git-feature-catalog.json)

## Scope
The registry contains 1,500 uniquely identified specifications across 30 modules. Each item includes five implementation points: UI, behavior, data/integration, security/testing, and an implementation prompt. The interface supports text search, module/status filters, pagination, detail view, prompt copy, and JSON export.

## Operational truth
All records start in `planned` status. The catalog does not assert that the described feature is already implemented or connected to a provider. Status must only be updated after code, tests, and integration have been verified. GitHub Pages serves static files; private repository mutations, secret storage, server-side jobs, and authenticated provider actions require an appropriately secured backend or official integration. Never put tokens or secrets in browser code or public catalog data.

## Integration
The main site links to the catalog from its existing feature navigation. The route is also registered in `data/system-registry.json`. The work is prepared on branch `feat/git-feature-catalog-1500` based on `io`.
