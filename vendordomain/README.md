# VendorDomain

## Portal utama

- **[VendorDomain — Domain & Web Services](./index.html)** — portal layanan utama dengan pemeriksaan format domain, generator nama, estimator biaya, penyimpanan catatan/keranjang lokal, draft website yang dapat diekspor sebagai HTML, koneksi health-check backend, dan pencarian seluruh 500 modul.
- **[Workspace operasional Enterprise](./enterprise/index.html)** — 150 ruang kerja modul dengan CRUD data, pencarian/filter, ekspor/impor JSON, audit, konfigurasi API, dan DNS Manager Cloudflare.
- **[Direktori 500 fitur](./features/index.html)** — katalog teknis dan halaman detail tiap fitur.
- **[Backend API](./backend/README.md)** — Node.js API untuk data persisten, validasi domain, audit dan DNS Cloudflare opsional.

## Batas integrasi produksi

Portal dan tools lokal berjalan sebagai frontend statis di GitHub Pages. Pemeriksaan domain di portal memvalidasi sintaks saja, bukan ketersediaan registrar. Estimator adalah simulasi, bukan harga penawaran vendor. Keranjang dan draft website disimpan di browser hingga diekspor; tidak memproses pembayaran atau memublikasikan situs otomatis.

Untuk data persisten dan DNS live, deploy backend secara terpisah melalui HTTPS dengan ADMIN_TOKEN, ALLOWED_ORIGIN, disk persisten, dan secret Cloudflare server-side bila diperlukan. Pendaftaran/transfer/perpanjangan domain, hosting, email, pembayaran, dan layanan vendor lain memerlukan integrasi API provider khusus dan tidak dianggap aktif sebelum dikonfigurasi serta diuji.

## Deployment

Workflow [Deploy entire .L system to GitHub Pages](../.github/workflows/deploy-pages.yml) dipicu oleh push ke branch `io`. Setelah perubahan digabungkan, periksa Actions untuk status deployment. URL halaman dapat berbeda mengikuti konfigurasi Pages repository.