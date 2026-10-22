# Planetbintang Mobile Workspace

Launcher mobile berbasis HTML/CSS/JS untuk menjalankan alat repositori GitHub `planetbintang/.L` dari satu layar. Tampilan utama mengikuti referensi perangkat seluler: bezel gelap, wallpaper abstrak bernuansa kaca cair, dock aplikasi vertikal, dan navigasi bawah.

Launcher juga menyediakan metadata PWA (`manifest.webmanifest`) sehingga dapat dipasang ke home screen perangkat dan dibuka dalam mode standalone.

## Menjalankan

```bash
python3 server.py
```

Buka `http://localhost:4173`.

## Interaksi utama

- Tombol menu di kiri atas atau tab **Menu** membuka drawer samping dengan konten menu sistem.
- **File Explorer** menampilkan file workspace dan preview teks secara read-only.
- **Workspace Index** menampilkan statistik file, folder, ukuran, dan metadata Git.
- **Repo Access** menampilkan remote GitHub, branch, dan visibility repository.
- **Bahasa & Input** menampilkan pengaturan shell mobile.
- Tombol **GitHub Repo** dan ikon GitHub di dock membuka informasi koneksi repositori.
- Tombol refresh pada kartu repositori membaca ulang metadata workspace.

## API read-only

- `GET /api/index` — indeks file workspace dan statistik ukuran.
- `GET /api/repository` — remote, branch, dan status Git.
- `GET /api/file?path=...` — preview file teks berukuran aman.
- `POST /api/index` — refresh indeks filesystem.

Server membatasi seluruh API pada root repositori ini dan tidak mengubah isi file saat indexing.
