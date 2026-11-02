# API GATEWAY & INTER-MODULE COMMUNICATION

Gateway, routing, autentikasi layanan, event bus, webhook dan kontrak versi.

Semua komponen merupakan kontrak manual

- [Routing API Gateway](./gateway-routing.reic) — `PB-GATEWAY-01`, aksi `gateway.route`, tabel `gateway_routes`.
- [Identitas Layanan](./service-identity.reic) — `PB-GATEWAY-02`, aksi `service.authenticate`, tabel `service_identities`.
- [Rate Limit dan Quota](./rate-limit.reic) — `PB-GATEWAY-03`, aksi `gateway.limit`, tabel `rate_limit_policies`.
- [Event Bus](./event-bus.reic) — `PB-GATEWAY-04`, aksi `event.publish`, tabel `outbox_events`.
- [Pengiriman Webhook](./webhook-delivery.reic) — `PB-GATEWAY-05`, aksi `webhook.deliver`, tabel `webhook_endpoints`.
- [Kontrak Antarmodul](./module-contracts.reic) — `PB-GATEWAY-06`, aksi `module.contract`, tabel `module_contracts`.

Setiap kontrak memakai deny-by-default, isolasi tenant, audit, idempotency, server-side provider adapter, serta persetujuan Owner/SNAPS untuk operasi berisiko. Status kontrak tidak menyatakan layanan provider sudah aktif.
