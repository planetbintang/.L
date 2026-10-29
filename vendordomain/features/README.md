# Indeks fitur VendorDomain

- `index.json`: data terstruktur untuk seluruh **500 fitur**, ID unik 001–500, modul, kategori, posisi, deskripsi, fungsi, status mode, persyaratan produksi, dan jalur navigasi.
- `index.html`: katalog pencarian/filter berbasis browser dengan 25 fitur per halaman; memvalidasi bahwa JSON berisi tepat 500 fitur.
- Sumber nama fitur tetap `../vendor.js`; file ini menambahkan indeks data, tidak mengganti katalog utama.

## Validasi dan batasan

Katalog memiliki 500 fitur (20 modul × 25 fitur). Fungsi yang dijelaskan adalah titik masuk dan perilaku yang dirancang untuk frontend/demo, bukan klaim layanan produksi aktif. Operasi registrar, DNS, TLS, penagihan, autentikasi, dan deployment memerlukan backend aman dan integrasi penyedia. Jangan simpan token rahasia di frontend.

## Membuka

Publikasikan folder ini bersama `vendordomain/` melalui GitHub Pages. URL: https://planetbintang.github.io/.L/vendordomain/features/
