# Manual REIC Component Library — PLANETBINTANG

Paket ini menyediakan 36 kontrak komponen manual dalam enam kelompok: identity, PostgreSQL, API Gateway, provider DNS/cloud, operations/security, dan enterprise billing/marketplace.

## Prinsip format

- `.reic`: kontrak deklaratif fitur, input/output, operasi, otorisasi, persetujuan, persistensi dan event.
- `.json`: registry, manifest dan schema.
- `.js`: parser, validator, controller dan adapter server.
- `.sql`: tabel, indeks, constraint, row-level security dan migrasi.
- `.yaml`: pipeline, policy dan konfigurasi lingkungan.
- `.html` + `.css`: panel operator; tidak boleh memuat secret.
- `.md`: dokumentasi, runbook, dan langkah pemulihan.

## Kelompok

- [IDENTITY & MULTI-USER ACCESS](./identity/README.md) — 6 komponen
- [POSTGRESQL & DATA SYNCHRONIZATION](./postgresql/README.md) — 6 komponen
- [API GATEWAY & INTER-MODULE COMMUNICATION](./gateway/README.md) — 6 komponen
- [DNS, DOMAIN, HOSTING & CLOUD STORAGE](./providers/README.md) — 6 komponen
- [MONITORING, BACKUP, RECOVERY & SECURITY](./operations/README.md) — 6 komponen
- [BILLING, MARKETPLACE & ENTERPRISE SERVICES](./enterprise/README.md) — 6 komponen

## Model keamanan

Semua aksi default DENY. Otorisasi dilakukan di server untuk setiap permintaan dengan actor, tenant, resource dan action. Role Owner tidak dapat disimulasikan oleh klaim browser. Mutasi eksternal, pembayaran, penghapusan, pemulihan dan perubahan DNS memerlukan approval token sekali pakai dan audit. Secret hanya berada pada secret manager/server environment.

## Status aktivasi

Kontrak dan migrasi adalah sumber implementasi. Database PostgreSQL belum disebut aktif sampai koneksi TLS, migrasi, backup, restore test dan health check berhasil pada lingkungan server. Provider DNS, registrar, hosting, object storage, payment dan marketplace memerlukan adapter nyata serta kredensial sandbox/produksi. GitHub Pages hanya menyajikan file statis.
