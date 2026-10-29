# Indeks fitur VendorDomain

- `index.json`: data terstruktur untuk seluruh **500 fitur**, ID unik 001–500, modul, kategori, posisi, deskripsi, fungsi, status mode, persyaratan produksi, dan jalur navigasi.
- `index.html`: katalog pencarian/filter berbasis browser dengan 25 fitur per halaman; memvalidasi bahwa JSON berisi tepat 500 fitur.
- Sumber nama fitur tetap `../vendor.js`; file ini menambahkan indeks data, tidak mengganti katalog utama.

## Halaman detail individual

Setiap fitur memiliki jalur statis unik `pages/feature-NNN/index.html` (500 halaman). File halaman memakai renderer bersama yang membaca ID dari URL dan data spesifik dari `index.json`, lalu menerapkan tema berbeda dan aksi demo sesuai modul. Fungsi interaktif berjalan di browser secara lokal; tidak mengubah registrar, DNS, akun, pembayaran, atau layanan eksternal. `index.json` menunjuk langsung ke setiap halaman.

## Validasi dan batasan

Katalog memiliki 500 fitur (20 modul × 25 fitur). Fungsi yang dijelaskan adalah titik masuk dan perilaku yang dirancang untuk frontend/demo, bukan klaim layanan produksi aktif. Operasi registrar, DNS, TLS, penagihan, autentikasi, dan deployment memerlukan backend aman dan integrasi penyedia. Jangan simpan token rahasia di frontend.

## Membuka

Publikasikan folder ini bersama `vendordomain/` melalui GitHub Pages. URL: https://planetbintang.github.io/.L/vendordomain/features/
