# VendorDomain

## Portal utama

- **[SNAPS — PLANETBINTANG Central Cloud](./cloud/index.html)** — control plane cloud terpusat untuk katalog domain, DNS, compute, hosting, storage, database, network, security, API, AI, observability, billing, dan deployment. Setiap item ditautkan ke halaman fitur REIC pada registry 500 fitur.
- **[VendorDomain — Domain & Web Services](./index.html)** — portal layanan utama dengan pemeriksaan format domain, generator nama, estimator biaya, penyimpanan catatan/keranjang lokal, draft website yang dapat diekspor sebagai HTML, koneksi health-check backend, dan pencarian seluruh 500 modul.
- **[Workspace operasional Enterprise](./enterprise/index.html)** — 150 ruang kerja modul dengan CRUD data, pencarian/filter, ekspor/impor JSON, audit, konfigurasi API, dan DNS Manager Cloudflare.
- **[Direktori 500 fitur](./features/index.html)** — katalog teknis dan halaman detail tiap fitur.
- **[Backend API](./backend/README.md)** — Node.js API untuk data persisten, validasi domain, audit dan DNS Cloudflare opsional.

## Sistem menu dan aset

Registry `features/index.json` memuat 500 menu dengan ID, modul, kategori, deskripsi, fungsi, status integrasi, dan `detailPath` masing-masing. Halaman detail REIC berada di `features/pages/feature-NNN/index.reic`, menggunakan `feature-runtime.js` dan `api-config.js`; halaman hasil publikasi tersedia sebagai HTML melalui proses konversi REIC. Dokumentasi modul dan struktur data berada di folder masing-masing.

Central Cloud menambahkan:
- `cloud/index.reic` — sumber tampilan SNAPS / PLANETBINTANG.
- `cloud/index.html` — halaman statis GitHub Pages.
- `cloud/cloud.css` dan `cloud/cloud.js` — tema, katalog layanan, pencarian, filter, dan routing.
- `cloud/database.schema.json` — skema logis proyek, domain, DNS, instance layanan, dan audit.
- `cloud/README.md` — dokumentasi sistem.

## Batas integrasi produksi

Portal dan tools lokal berjalan sebagai frontend statis di GitHub Pages. Pemeriksaan domain di portal memvalidasi sintaks saja, bukan ketersediaan registrar. Estimator adalah simulasi, bukan harga penawaran vendor. Keranjang dan draft website disimpan di browser hingga diekspor; tidak memproses pembayaran atau memublikasikan situs otomatis.

Untuk data persisten dan DNS live, deploy backend secara terpisah melalui HTTPS dengan ADMIN_TOKEN, ALLOWED_ORIGIN, disk persisten, dan secret Cloudflare server-side bila diperlukan. Pendaftaran/transfer/perpanjangan domain, hosting, email, pembayaran, dan layanan vendor lain memerlukan integrasi API provider khusus dan tidak dianggap aktif sebelum dikonfigurasi serta diuji. GitHub Pages tidak menjalankan database atau layanan backend.

## Deployment

Workflow [Deploy entire .L system to GitHub Pages](../.github/workflows/deploy-pages.yml) dipicu oleh push ke branch `io`. Setelah perubahan digabungkan, periksa Actions untuk status deployment. URL halaman dapat berbeda mengikuti konfigurasi Pages repository.

## Pengembang dan konfigurasi inti

- Semua 25 fitur modul **Pengembang dan konfigurasi inti** (ID 476–500) dibuka melalui workspace berlapis di [`developer-core/index.html`](./developer-core/index.html).
- Setiap fitur memiliki enam lapisan: Layout, Pilihan, Penerapan, Penyimpanan, Penyimpanan Sistem Folder/File, dan Konfigurasi. Variasi layout: Rail, Split, Stack, Grid, dan Console.
- Draft serta JSON konfigurasi dapat divalidasi, disimpan di browser, diimpor, dan diekspor. Registry fitur berada di [`config/developer-core/registry.json`](./config/developer-core/registry.json).
- Penyimpanan browser bersifat lokal per perangkat. Penulisan ke repository, penerapan CI/CD, dan deployment sungguhan tetap memerlukan backend/API atau workflow yang terautentikasi; halaman ini tidak menjalankan perubahan produksi.

## Ribuan file lapisan runtime

Layer System menambahkan 1.500 file sumber khusus untuk 500 fitur (tiga file per fitur):
- `layers/feature-NNN/manifest.json` — entrypoint dan peta lapisan.
- `layers/feature-NNN/service.reic` — kontrak layanan REIC dengan 10 lapisan tanggung jawab.
- `layers/feature-NNN/controller.js` — controller ES module khusus fitur yang memanggil shared engine.

Runtime bersama berada di `layer-system/`: `runtime.js` memuat manifest, kontrak, dan controller; `engine.js` membangun panel konfigurasi; `engine.css` menyediakan layout; `registry.json` mendaftarkan seluruh 500 bundle. `features/feature-runtime.js` menghubungkan setiap halaman fitur ke runtime lapisan.

Setiap halaman menampilkan 10 lapisan: Identity & Registry, Presentation & REIC, Service Contract, Controller Runtime, Validation Engine, Persistence Adapter, Security Policy, Observability, API Boundary, dan Deployment Metadata. Mesin browser mendukung validasi JSON, penyimpanan lokal, serta ekspor konfigurasi. Ini merupakan scaffold runtime aktif untuk konfigurasi lokal, bukan klaim bahwa seluruh operasi provider cloud telah aktif. Provisioning, registrar, billing, database persisten, dan operasi DNS tetap memerlukan backend dan kredensial provider yang aman.

## Ekosistem platform dan operasi

- [Service catalog](./ecosystem/service-catalog.json) — status domain layanan dan dependensi provider.
- [Event envelope](./ecosystem/event-envelope.schema.json) — kontrak event berversi untuk integrasi asinkron.
- [Provider adapter contract](./ecosystem/provider-adapter-contract.md) — batas aman integrasi pihak ketiga.
- [Production readiness checklist](./ecosystem/production-readiness.md) — gerbang keamanan dan kesiapan produksi.
- [PostgreSQL core migration](./backend/migrations/001_core.sql) — skema tenant, user, membership, project, domain, DNS, instance, dan audit.
- [Backend integration tests](./backend/test/server.test.mjs) — pengujian API melalui Node.js test runner; CI workflow ada di `.github/workflows/vendordomain-api-tests.yml`.

Navigasi VendorDomain sekarang memiliki pintasan **CENTRAL CLOUD** ke control plane katalog layanan.


## 51 REIC automation blueprints

- [51 lembar blueprint otomasi biner SNAPS · PLANETBINTANG](./blueprints/index.html) — 51 dokumen penjelasan, 51 kontrak .reic, dan 2.601 baris rumus biner yang dapat ditinjau.
- [Formula DSL dan batas runtime](./blueprints/FORMULA-DSL.md) — semantik operator, gerbang Owner, dan alur parser.
- [Schema kontrak REIC](./blueprints/reic-blueprint.schema.json) dan [validator paket](./blueprints/verify-blueprints.mjs).

Paket blueprint berstatus spesifikasi sampai parser/runtime, integrasi backend, sandbox, dan persetujuan Owner tersedia. Rumus tidak mengeksekusi operasi cloud secara langsung.


## Manual REIC platform components

Library [vendordomain/reic](./reic/README.md) adds 36 manual REIC components in six domains: identity and multi-user access, PostgreSQL and synchronization, API Gateway and module communication, DNS/domain/hosting/cloud storage, monitoring/backup/recovery/security, and billing/marketplace/enterprise. The contracts share OWNER governance, SNAPS policy authority, PLANETBINTANG ownership, deny-by-default, tenant isolation, idempotency and audit. Run `npm run validate:reic` from `vendordomain/backend` to validate the registry. Migration `002_platform_modules.sql` requires review and a tested backup before application.
