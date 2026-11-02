# BILLING, MARKETPLACE & ENTERPRISE SERVICES

Katalog, paket, meter penggunaan, ledger, pembayaran, invoice, SLA dan tenant enterprise.

Semua komponen merupakan kontrak manual

- [Katalog Layanan](./service-catalog.reic) — `PB-ENTERPRISE-01`, aksi `catalog.publish`, tabel `service_catalog`.
- [Listing Marketplace](./marketplace-listing.reic) — `PB-ENTERPRISE-02`, aksi `marketplace.publish`, tabel `marketplace_listings`.
- [Meter Penggunaan](./usage-metering.reic) — `PB-ENTERPRISE-03`, aksi `billing.meter`, tabel `usage_records`.
- [Ledger dan Invoice](./billing-ledger.reic) — `PB-ENTERPRISE-04`, aksi `billing.invoice`, tabel `billing_ledger`.
- [Adapter Pembayaran](./payment-adapter.reic) — `PB-ENTERPRISE-05`, aksi `payment.execute`, tabel `payment_intents`.
- [Layanan Enterprise dan SLA](./enterprise-sla.reic) — `PB-ENTERPRISE-06`, aksi `enterprise.sla`, tabel `enterprise_contracts`.

Setiap kontrak memakai deny-by-default, isolasi tenant, audit, idempotency, server-side provider adapter, serta persetujuan Owner/SNAPS untuk operasi berisiko. Status kontrak tidak menyatakan layanan provider sudah aktif.
