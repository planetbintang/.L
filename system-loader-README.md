# System loader integration

Shared loader assets are in `system-loader.css` and `system-loader.js`. The loader is a presentation/navigation aid with a 9-second safety timeout. Offline fallback is provided at `system-offline.html`. Service-worker registration is deliberately not enabled because root-scoped caching can affect all dashboard routes; test separately before activation.
