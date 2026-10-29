# VendorDomain Enterprise Workspace

Aplikasi web operasional VendorDomain untuk 150 modul yang dikelompokkan ke dalam 10 kategori. Halaman utama sekarang adalah ruang kerja yang dapat dipakai untuk membuat, membaca, mengubah, menghapus, mencari, dan mengekspor data per modul — bukan katalog prompt sebagai halaman utama.

## Halaman

- **Workspace operasional:** [index.html](./index.html) — 150 modul dengan route/workspace per fitur.
- **Spesifikasi 150 modul:** [catalog.html](./catalog.html) — spesifikasi, tampilan yang dituju, perilaku, integrasi dan prompt implementasi; hanya dokumentasi pendamping.
- **Backend API:** [backend/README.md](../backend/README.md) — Node.js API untuk record persisten, validasi domain, audit dan DNS Cloudflare opsional.

## Fungsi yang dapat digunakan

- 150 modul dan pencarian/filter kategori.
- Ruang kerja terpisah per modul; CRUD data dengan jenis record per modul, pencarian, pengeditan, penghapusan dengan konfirmasi, serta ekspor JSON.
- Penyimpanan browser lokal bila backend belum dikonfigurasi; label mode membedakan data lokal dan backend.
- Koneksi backend melalui URL HTTPS yang diatur pengguna, health check, CRUD record persisten, dan audit ketika API/token tersedia.
- Validasi sintaks domain melalui endpoint backend bila terjangkau atau validasi lokal; bukan pengecekan ketersediaan registrar.
- DNS Manager untuk membaca, membuat dan menghapus record Cloudflare melalui backend. Tindakan DNS hanya aktif bila backend, autentikasi, token Cloudflare dan zone ID benar-benar tersedia.
- Ekspor semua record dan impor JSON ke penyimpanan lokal.
- Responsif desktop dan perangkat seluler.

## Jalankan backend

Ikuti [panduan backend](../backend/README.md). API membutuhkan Node.js 20+, disk persisten, HTTPS/reverse proxy, ADMIN_TOKEN, ALLOWED_ORIGIN, dan DATA_DIR. Untuk DNS, atur CLOUDFLARE_API_TOKEN dan CLOUDFLARE_ZONE_ID hanya pada environment server. URL frontend GitHub Pages harus ditambahkan sebagai origin yang diizinkan.

Setelah backend siap, buka **Konfigurasi sistem**, masukkan URL HTTPS dan token admin untuk sesi browser tepercaya, lalu tes koneksi. Token disimpan di sessionStorage untuk sesi tab, tidak dimasukkan ke source code. Untuk deployment produksi dengan banyak pengguna, gunakan server-side session/proxy dan jangan menyebarkan admin token ke browser.

## Batas kemampuan eksternal

Pendaftaran/transfer/perpanjangan domain, pembayaran/invoice, hosting, cloud compute, email, sertifikat, serta CRM yang memerlukan provider eksternal tidak boleh dianggap aktif hanya karena ada modulnya. Modul-modul itu saat ini memberi ruang kerja data yang bisa dipakai; operasi provider nyata perlu API/kontrak provider, implementasi backend khusus, otorisasi, audit, pengujian, dan konfigurasi. GitHub Pages sendiri hanya menyajikan frontend statis.

## Pemeriksaan

JavaScript inline diperiksa sintaksnya setelah perubahan. Uji browser end-to-end, deploy backend, kredensial Cloudflare, dan verifikasi URL GitHub Pages belum dijalankan dari sini.
