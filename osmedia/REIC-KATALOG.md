# OS MEDIA VM — REIC Enterprise Desktop

Fondasi deklaratif utama adalah REIC. Setiap komponen katalog memiliki tiga berkas terpisah dengan nama dasar yang sama: `.reic`, `.css`, dan `.js`.

## Katalog 15.000 komponen
Jalankan `node osmediavm/scripts/generate-reic.mjs` untuk membangun 15.000 komponen (45.000 berkas komponen) dan `manifest.json`. Alur GitHub Actions `Bangun katalog komponen REIC` dapat dijalankan manual melalui tab Actions.

## Batas runtime
GitHub Pages hanya menjalankan frontend statis. Database, server aplikasi, SSO, antrean pekerjaan, dan inferensi AI membutuhkan backend atau layanan eksternal. Berkas modul menyertakan status dan aksi sisi-klien, bukan mengklaim server eksternal sudah aktif.
