# REIC Core — Ocean Elite

Status: core foundation activated on the canonical root document (index.reic) on branch io.

## Source format

- .reic: HTML-compatible REIC document or JSON manifest.
- .reicss: CSS-compatible REIC style module.
- .reicjs: ECMAScript module for runtime behavior, imports and exports.
- Browser compatibility is provided by fetching .reicjs as text and importing it as a JavaScript module. This avoids relying on custom MIME support for GitHub Pages.

## Layer model

1. Foundation — runtime and capability detection.
2. Design system — Ocean Elite tokens, surfaces, focus and motion.
3. Components — reusable UI contracts.
4. Application — page and desktop behavior.
5. Integration — HTTP/API/data adapters.
6. Observability — status, audit and diagnostics.

## Syntax profile registry

reic-core.reicjs defines 52 semantic families and 4,096 deterministic profile identifiers per family (212,992 profile identifiers total). Profiles are resolved and paginated on demand; they are not 212,992 separately generated source files and do not imply 212,992 independent executable language grammars.

Public API:

- REICCore.inspect() — version, family count, profile count and registered modules.
- REICCore.resolve('REIC.COMPONENT.0001') — validate and resolve a profile identifier.
- REICCore.list({ family, offset, limit }) — page through identifiers.
- REICCore.register(name, definition) — register a named module contract.
- REICCore.activate() — activate the shared root design layer.

## Compatibility and migration

This is a compatibility-first foundation, not a blind mass rewrite. Existing HTML/CSS/JS files remain in place until each page/module has been mapped, converted, and tested. Renaming all files or replacing their contents without dependency analysis would break script loading, routes, integrations, and generated GitHub Pages output.

Use paired .reic, .reicss, and .reicjs modules for new or deliberately migrated components. Keep generated HTML/CSS/JS outputs compatible with the current Pages build process. Do not add placeholder files or repetitive filler to inflate counts.

## Validation

After each migration batch, run the repository's existing REIC audits and Pages build checks. Verify both the source document and generated index.html, then inspect the latest Pages workflow for the exact commit being released.
