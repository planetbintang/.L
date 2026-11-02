# SNAPS · PLANETBINTANG Central Cloud

Portal: [Central Cloud](./index.html) · [VendorDomain](../index.html) · [Registry 500 fitur](../features/index.html).

## Tujuan
Satu control plane untuk mengelola katalog layanan domain dan cloud PlanetBintang. Antarmuka memakai identitas SNAPS / PLANETBINTANG dan pola workspace cloud enterprise: katalog layanan, pencarian, registry, serta pintasan menuju halaman detail tiap fitur.

## Sistem file
- `index.reic`: sumber halaman REIC.
- `index.html`: keluaran web statis untuk GitHub Pages.
- `cloud.css`: tema dan layout responsif.
- `cloud.js`: pemuatan registry, pencarian, filter, dan routing menu.
- `database.schema.json`: skema logis untuk proyek, domain, DNS, instance layanan, dan audit.

## Menu dan halaman
Portal membaca `../features/index.json` yang memuat 500 fitur. Setiap item membuka `detailPath` miliknya sendiri; tampilan dan perilaku fitur disediakan oleh REIC/runtime fitur VendorDomain.

## Batas produksi
GitHub Pages hanya menyajikan frontend statis. Status API ditandai opsional sampai backend HTTPS benar-benar dideploy dan dikonfigurasi. Pendaftaran domain, perubahan DNS, provisioning compute, pembayaran, dan operasi cloud lain tidak dianggap aktif hanya karena tombol atau halaman tersedia. Simpan token/secret di server, gunakan RBAC, audit, rate limit, validasi input, dan integrasi resmi provider.

## Deploy
Commit ke branch `io`; workflow GitHub Pages repository akan menerbitkan file statis. Verifikasi hasil melalui GitHub Actions sebelum menyatakan deployment selesai.
