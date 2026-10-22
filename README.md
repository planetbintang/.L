# Bahasa & Input System

Desktop settings UI bergaya ALRA OS untuk mengelola bahasa, input, dan LL Core Display.

## Menjalankan

Jalankan desktop workspace dari folder ini agar indeks filesystem dan modal Explorer aktif:

```bash
python3 server.py
```

Lalu buka `http://localhost:4173`.

`server.py` membatasi API pada root repository ini (`/home/ubuntu/sumberkode`) dan menyediakan endpoint read-only:

- `GET /api/index` — indeks seluruh file workspace dan statistik ukuran.
- `GET /api/repository` — remote, branch, dan status Git.
- `GET /api/file?path=...` — preview file teks berukuran aman.
- `POST /api/index` — refresh indeks filesystem.

## Fitur utama

- Sidebar kategori pengaturan dengan status aktif.
- Panel Bahasa & Input dengan pencarian modul.
- LL Core di sudut kiri dan kanan.
- Posisi L `1` menampilkan garis di atas; posisi `2` memindahkan garis ke kanan.
- Toggle visibilitas LL Core, pilihan tema, reset, dan simpan konfigurasi.
- Desktop Workspace dengan aplikasi File Explorer, Workspace Index, Repo Access, dan Settings.
- Metadata repo privat/publik, branch, remote, file tracked, modified, dan system file.
- Modal file explorer dengan filter path dan preview isi file secara read-only.
