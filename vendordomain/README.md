# VendorDomain

## Aplikasi utama

- **VendorDomain Enterprise Workspace:** [buka kode aplikasi](./enterprise/index.html) — 150 ruang kerja modul, CRUD data per modul, pencarian/filter, ekspor/impor JSON, validasi sintaks domain, koneksi API, audit, dan DNS Manager Cloudflare opsional.
- **Spesifikasi dan prompt 150 modul:** [catalog.html](./enterprise/catalog.html) — dokumentasi pendamping; bukan halaman utama aplikasi.
- **Backend API:** [panduan backend](./backend/README.md) — Node.js, penyimpanan persisten, domain validation, audit, dan endpoint DNS Cloudflare.

## Deploy

GitHub Pages hanya menjalankan frontend statis. Backend harus dideploy secara terpisah ke layanan Node.js dengan HTTPS, disk persisten, dan environment secret yang aman. Setelah backend berjalan, atur URL HTTPS pada menu **Konfigurasi sistem** di aplikasi. Jangan commit token API ke repositori atau menaruh token provider dalam kode frontend.

DNS live hanya tersedia bila backend memiliki CLOUDFLARE_API_TOKEN dan CLOUDFLARE_ZONE_ID yang benar, serta admin API terautentikasi. Pendaftaran domain, transfer, renewal, pembayaran, hosting, email, dan layanan provider lain tetap memerlukan integrasi provider khusus; jangan menganggapnya aktif hanya karena ada modul workspace.

## Berkas

- `enterprise/index.html`: aplikasi operasional frontend.
- `enterprise/catalog.html`: katalog spesifikasi 150 modul dan 1.800 submenu.
- `enterprise/README.md`: cara penggunaan dan batas integrasi.
- `backend/server.mjs`: API backend.
