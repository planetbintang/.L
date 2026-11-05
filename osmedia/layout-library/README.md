# OS MEDIA VM — REIC Layout Library

Layout Library terhubung langsung ke `recordin/components/manifest.json` dan membaca katalog 15.000 komponen REIC.

## Pemetaan layout otomatis

Setiap komponen dipetakan berdasarkan bidang dan kata kunci pada ID/judul:
- Identitas & desain → Canvas Komponen
- Desktop & navigasi → Workbench Dua Kolom
- File Manager & data → Library Kartu
- Server & tata kelola → Dashboard Modular
- Keamanan, DevOps & observabilitas → Console Teknis
- Runtime & API → Workbench Dua Kolom
- AI & otomasi → Canvas Komponen

Pemetaan kata kunci yang lebih spesifik dapat mengarahkan komponen ke layout yang paling sesuai. Katalog dapat dicari berdasarkan nomor, nama, atau bidang dan ditampilkan dengan pagination.

## Alur integrasi

1. Cari dan pilih nama komponen REIC.
2. Layout yang sesuai dipilih otomatis dan ditampilkan pada pratinjau.
3. Atur lebar, kepadatan, tema, navigasi samping, dan perilaku responsif.
4. Ekspor binding `.reic` yang mencatat ID, judul, bidang, lokasi berkas sumber, serta preset layout.
5. Hubungkan `reic-layout.reiccss` dan `reic-layout.reicjs` lalu tempatkan konten komponen sumber pada slot yang disediakan.

Tombol **Terapkan preset** hanya menyimpan pilihan pada localStorage browser. Ekspor binding tidak menulis ulang 15.000 berkas sumber secara otomatis; pemasangan pada modul tujuan tetap memerlukan integrasi berkas binding dan aset pendamping.

GitHub Pages menyajikan aset statis. Penyimpanan lintas perangkat, akun, API, dan sinkronisasi server memerlukan backend terpisah.
