# OS MEDIA VM

Desktop web modular dan fondasi inti runtime untuk proyek Planetbintang.

## Pusat Aplikasi
Buka `pusat_aplikasi/index.html` untuk mencari katalog 1.000 aplikasi sistem, menyaring kategori, menelusuri halaman hasil, dan membaca manifes konfigurasi aplikasi.

## Struktur
- `mesin_runtime/`: inti runtime peramban dan daftar aplikasi.
- `berkas_sistem/`: 1.000 manifes aplikasi dalam berkas JSON yang terpisah dan dikelompokkan ke 10 folder berbahasa Indonesia.
- `pusat_aplikasi/`: antarmuka katalog aplikasi.
- `index.html`: desktop OS MEDIA VM.

## Kesesuaian dengan AI Reber
Struktur berkas memakai ekstensi yang ditemukan pada pohon sumber AI Reber, termasuk HTML, JS, CSS, JSON, Markdown, TypeScript, SQL, SVG, dan TXT. Manifes aplikasi menggunakan JSON agar aman dibaca oleh halaman statis. Ekstensi lain dipakai untuk dokumentasi dan modul runtime.

## Batas pelaksanaan
GitHub Pages menyediakan situs statis. Runtime saat ini membaca konfigurasi JSON dan menyajikan katalog; ia tidak mengaku menjalankan proses sistem operasi, peladen, DNS, atau kode aplikasi arbitrer. Layanan semacam itu harus dibangun dan diaktifkan terpisah dengan kontrol keamanan yang sesuai.
