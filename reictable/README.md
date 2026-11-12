# PlanetBintang REICTABLE

Registry and deterministic data reconstruction engine.

- manifest.json: 128 module definitions across eight domains.
- modules/<domain>/*.reic: 128 physical REIC files with JSON schemas and formula declarations.
- engine/reic-table.mjs: 16 allowlisted deterministic formulas; no eval/Function.
- engine/build-registry.mjs: schema validation and File Manager index.
- engine/test.mjs: formula tests.
- engine/reconstruct.mjs: non-destructive repository inventory.

GitHub Pages is static hosting. GitHub Actions writes repository snapshots; it is not a continuously running database/API. Cross-device login and real-time writes require a separately deployed authenticated backend. Never store secrets or private user data in public files.
