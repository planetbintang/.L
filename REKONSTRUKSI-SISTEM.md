# REKONSTRUKSI SISTEM PLANETBINTANG

Dokumen ini menjadi kontrak rekonstruksi bertahap untuk repository `planetbintang/.L`.
Tujuannya menyatukan sistem yang telah ada tanpa menghapus modul, data, route, atau identitas
yang masih digunakan.

## Prinsip wajib

1. Audit sebelum mengubah: inventarisasi route, file, manifest, dependensi, dan workflow.
2. Pertahankan kompatibilitas GitHub Pages pada prefix repository `/.L/`; gunakan URL relatif.
3. Jangan mengganti modul yang sudah berfungsi dengan halaman demo atau katalog statis.
4. Setiap fitur harus mempunyai status nyata: aktif, lokal-browser, memerlukan backend,
   atau belum terhubung. Jangan menyatakan integrasi eksternal aktif tanpa pengujian.
5. Pertahankan desain dan navigasi PlanetBintang; perubahan UI harus konsisten lintas desktop,
   tablet, dan ponsel.
6. Jangan menjalankan kode repository, shell, binary, atau REIC arbitrer di browser publik.
7. Rahasia, token, kredensial, dan data privat tidak boleh masuk ke aset frontend atau log publik.

## Peta sistem kanonis

| Sistem | Lokasi utama | Tanggung jawab rekonstruksi |
|---|---|---|
| Root Dashboard / Hub | `index.html`, `dashboard.css`, `data/` | Navigasi utama, snapshot, metrik, pencarian, route workspace |
| File Manager | Root workspace dan `data/trees/` | Pohon folder, breadcrumb, pencarian, pagination, status file |
| Shell | Root shell UI | Perintah allowlist read-only; tanpa eksekusi arbitrary |
| Pusat Pengembangan | katalog fitur root | Registry fitur, detail, workspace implementasi, status |
| OS MEDIA VM | `osmediavm/` | Runtime browser, aplikasi, integrasi, layout library, REIC explorer |
| VMDESKTOPREIC | `vmdesktopreic/` | Desktop 1920×1080 responsif, workspace, modal/layer, keyboard |
| REIC | `osmediavm/recordin/`, `vmdesktopreic/` | Parser/renderer terbatasi, skema komponen, CSS/JS terpisah |
| Galeri | `galeri/` | Tampilan dan navigasi selaras dengan OS MEDIA VM |
| Perpustakaan | `leksikon/` | Kamus digital, pencarian, kategori, data bertahap |
| VendorDomain | `vendordomain/` | Portal domain, workspace 150 fitur, direktori 500 fitur |
| Aireber | `aireber/` | Antarmuka AI dan adapter; provider hanya aktif setelah konfigurasi |
| AirCloud | `airz/` dan modul terkait | Workspace cloud; konektor dan penyimpanan harus terverifikasi |
| Media / manifest | `media/` | Identitas, katalog repo, sumber asli, indeks dan hash |
| Sistem inti | `acct/`, `sys/`, `system_ext/`, `cache/`, `config/`, `data/` | Akun, konfigurasi, cache, data bersama, dan pemisahan sistem |
| Deployment | `.github/workflows/` | Build, validasi, Pages deploy, dan sinkronisasi snapshot |

## Kontrak arsitektur

### A. Presentasi dan navigasi
- Satu sumber definisi route/menu agar header, sidebar, dropdown, dan deep-link konsisten.
- Setiap route mempunyai judul, pemilik modul, status, entry point, dan fallback.
- Semua route diuji pada root Pages `/.L/`, bukan hanya localhost.
- Navigasi keyboard, fokus terlihat, label aksesibel, dan reduced-motion wajib dipertahankan.

### B. Registri fitur dan komponen
- Setiap fitur memiliki ID stabil, nama, kategori, route, entry point, dependensi,
  status implementasi, dan tingkat integrasi.
- Komponen REIC menggunakan manifest tervalidasi; renderer hanya menerima tipe komponen
  dan properti yang diizinkan.
- File komponen, stylesheet, skrip, dan dokumentasi mempunyai hubungan eksplisit.
- Jumlah katalog (misalnya 1.500 atau 15.000) tidak boleh disamakan dengan jumlah fitur
  yang benar-benar selesai dan diuji.

### C. Data dan penyimpanan
- Data publik yang aman dapat disajikan sebagai JSON statis dengan skema dan versi.
- Preferensi lokal diberi label penyimpanan browser dan mekanisme ekspor/impor.
- Data persisten lintas perangkat memerlukan backend terautentikasi.
- Mutasi repository dilakukan melalui workflow/API berizin, bukan klaim dari localStorage.
- Snapshot harus menyimpan waktu pembaruan, sumber, cakupan, dan status kelengkapan.

### D. Layanan server dan integrasi
- GitHub Pages hanya untuk frontend statis.
- API, database, autentikasi, billing, DNS, AI provider, dan proses sistem harus berjalan
  pada layanan backend yang terpisah.
- Secret hanya berada di environment/secret manager server atau GitHub Actions.
- Semua integrasi memiliki health check, timeout, validasi input, audit, dan penanganan gagal.

### E. Keamanan dan privasi
- Terapkan autentikasi dan otorisasi server-side, validasi input, CSRF protection,
  rate limiting, audit log, kebijakan CORS, dan backup sebelum layanan produksi.
- Jangan tampilkan nama/path repository privat ke publik kecuali kebijakan pemilik
  secara eksplisit mengizinkannya.
- Jangan mengunduh atau mengeksekusi blob repository untuk sekadar membuat indeks.
- REIC tidak boleh menggunakan `eval`, `Function`, atau injeksi HTML tanpa sanitasi.

## Urutan rekonstruksi dan kriteria selesai

### Tahap 1 — Inventaris dan baseline
- Petakan seluruh direktori, entry point, route, manifest, workflow, dan file duplikat.
- Catat fitur aktif, fitur lokal, fitur backend-dependent, dan fitur rusak.
- Simpan baseline commit dan jangan menghapus data sebelum ada pemetaan pengganti.
- Kriteria: seluruh route utama mempunyai pemilik dan status yang tercatat.

### Tahap 2 — Stabilitas root dan deployment
- Validasi semua aset relatif, deep-link, refresh route, cache-busting, dan 404.
- Jalankan pemeriksaan HTML/CSS/JS/JSON serta pemeriksaan link internal.
- Pastikan workflow Pages membangun dan menerbitkan artefak yang benar.
- Kriteria: halaman utama dan semua menu utama dapat dimuat langsung dan melalui refresh.

### Tahap 3 — Integrasi antarmodul
- Satukan kontrak menu, route, tema, event, manifest, dan status fitur.
- Hubungkan Root Dashboard, File Manager, OS MEDIA VM, VMDESKTOPREIC,
  Galeri, Perpustakaan, VendorDomain, Aireber, AirCloud, dan Media.
- Kriteria: navigasi silang berfungsi tanpa route mati atau konflik CSS/JS.

### Tahap 4 — Runtime REIC dan desktop
- Validasi parser/manifest, registri komponen, layer/modal, workspace, keyboard,
  resize/orientation, dan batas ukuran desktop.
- Terapkan pemuatan bertahap dan isolasi modul; jangan memuat seluruh katalog sekaligus.
- Kriteria: fitur yang berstatus aktif dapat dibuka, ditutup, dipulihkan, dan diuji
  tanpa error konsol yang menghalangi penggunaan.

### Tahap 5 — Data, backend, dan integrasi eksternal
- Tetapkan skema API, autentikasi, database, audit, backup, serta adapter provider.
- Aktifkan satu per satu hanya setelah secret, izin, deployment, dan tes integrasi tersedia.
- Kriteria: operasi tulis dan integrasi live diverifikasi dari server; bukan simulasi browser.

### Tahap 6 — Pengujian dan rilis
- Uji desktop 1920×1080, laptop, tablet, ponsel portrait dan landscape.
- Uji keyboard, aksesibilitas, performa, jaringan lambat, kegagalan API, dan pemulihan.
- Jalankan workflow deploy, periksa hasil Actions dan URL Pages, lalu catat SHA rilis.
- Kriteria: laporan tes, batasan, daftar fitur aktif, dan SHA deployment tersedia.

## Catatan baseline yang telah diverifikasi

- Repository: `planetbintang/.L`; branch target: `io`.
- Root dashboard dan sistem workspace sudah memiliki dokumentasi serta beberapa sistem
  snapshot dan navigasi.
- OS MEDIA VM memiliki pusat integrasi, pusat aplikasi, dan dokumentasi batas runtime.
- VMDESKTOPREIC memiliki loader `desktop.reic`, `desktop.js`, `workspace.js`,
  `desktop-runtime.js`, dan pemuatan `layers.js` saat interaksi.
- VendorDomain mendokumentasikan portal, workspace enterprise, katalog fitur, dan backend
  terpisah; sebagian penyimpanan saat ini masih lokal browser.
- Aireber mendokumentasikan adapter GitHub Pages statis; layanan upstream tidak otomatis aktif.
- Karena Pages bersifat statis, backend dan integrasi produksi tidak dapat dianggap tersedia
  hanya karena antarmuka atau katalog fiturnya sudah ada.

## Status dokumen

Dokumen ini adalah peta kerja dan kontrak teknis, bukan pernyataan bahwa semua tahap telah
selesai. Setiap implementasi berikutnya harus mengubah kode modul terkait, menambahkan tes,
dan mencatat hasil deployment secara terpisah.
