# DNS, DOMAIN, HOSTING & CLOUD STORAGE

Adapter registrar, DNS, sertifikat, hosting, object storage dan provisioning cloud.

Semua komponen merupakan kontrak manual

- [Adapter Registrar](./registrar-adapter.reic) — `PB-PROVIDERS-01`, aksi `domain.registrar`, tabel `provider_connections`.
- [Zona dan Record DNS](./dns-zone.reic) — `PB-PROVIDERS-02`, aksi `dns.record`, tabel `dns_records`.
- [Siklus Domain](./domain-lifecycle.reic) — `PB-PROVIDERS-03`, aksi `domain.lifecycle`, tabel `domains`.
- [Sertifikat TLS](./tls-certificates.reic) — `PB-PROVIDERS-04`, aksi `tls.certificate`, tabel `tls_certificates`.
- [Hosting dan Runtime](./hosting-runtime.reic) — `PB-PROVIDERS-05`, aksi `hosting.deploy`, tabel `hosting_instances`.
- [Cloud Object Storage](./cloud-object-storage.reic) — `PB-PROVIDERS-06`, aksi `storage.object`, tabel `storage_buckets`.

Setiap kontrak memakai deny-by-default, isolasi tenant, audit, idempotency, server-side provider adapter, serta persetujuan Owner/SNAPS untuk operasi berisiko. Status kontrak tidak menyatakan layanan provider sudah aktif.
