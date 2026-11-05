# Pusat Integrasi OS MEDIA VM

Pusat Integrasi menyatukan peta modul, jenis tampilan, kontrak integrasi, dan preferensi browser untuk OS MEDIA VM.

## Berkas
- `index.html`: antarmuka panel integrasi.
- `integrasi.css`: gaya responsif.
- `integrasi.js`: renderer, preferensi sesi, dan validasi struktur.
- `integrasi.json`: manifes modul, tipe tampilan, pengaturan, dan kontrak.

## Membuka
Dari situs GitHub Pages, buka `/osmediavm/pusat_integrasi/`. Halaman ini juga dapat dibuka langsung dari repositori.

## Pola integrasi
Setiap modul baru sebaiknya mendefinisikan `id`, `name`, `description`, `entry`, `view_type`, `config`, `capabilities`, dan `status`. Jenis tampilan dipilih dari `view_types` pada manifes. Daftarkan modul pada `modules` setelah target berkas tersedia dan telah diperiksa.

## Batas
GitHub Pages adalah hosting statis. Pengaturan di antarmuka disimpan di sessionStorage browser dan tidak mengubah berkas GitHub. Konfigurasi repository diubah lewat commit. Akses perangkat, proses OS, database, atau layanan server membutuhkan backend/adapter yang dibangun dan diamankan secara terpisah. Status `ready` hanya boleh dipakai setelah target dan perilakunya benar-benar diuji.
