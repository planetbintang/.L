# VendorDomain Layer System

A shared ES-module runtime mounts a dedicated service bundle for each of the 500 feature pages.

## Per-feature bundle
Each feature has three source files under `layers/feature-NNN/`:
- `manifest.json`: versioned entrypoints and layer map.
- `service.reic`: JSON-compatible REIC service contract describing responsibilities, dependencies, safety boundaries and operational capabilities.
- `controller.js`: ES-module entrypoint that mounts the feature-specific contract through the shared engine.

## Execution flow
Feature page -> `features/feature-runtime.js` -> `layer-system/runtime.js` -> manifest -> REIC service contract -> feature controller -> shared engine -> browser-local configuration.

## Layers represented
Identity/registry, presentation, service contract, controller, validation, persistence adapter, security policy, observability, API boundary, deployment metadata.

## Safety / deployment
The browser engine validates and exports configuration and stores drafts in localStorage. It does not expose secrets, provision infrastructure, perform registrar transactions, or claim live cloud status. Live operations require a separately deployed authenticated HTTPS backend, persistent database, authorization, audit, provider-specific integrations, and tested CI/CD.
