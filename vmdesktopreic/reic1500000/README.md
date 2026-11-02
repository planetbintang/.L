# VMDESKTOPREIC — 1.500.000 FILE SYSTEM

Target fisik: **1.500.000 file** yang dibagi menjadi 500.000 modul; setiap modul memiliki `index.reic`, `index.reicss`, dan `index.reicjs`.

## Progres file fisik

- Batch 0001–0003: modul 1–93.
- Batch 0004: modul 94–123 (30 modul / 90 file).
- Batch 0005: modul 124–133 (10 modul / 30 file).
- Batch 0006: modul 134–138 (5 modul / 15 file).
- **Total terverifikasi: 138 modul / 414 file fisik** dari target 500.000 modul / 1.500.000 file.
- Sisa target: 499.862 modul / 1.499.586 file.

Setiap batch menyimpan manifest dan tiga berkas per modul: `.reic`, `.reicss`, dan `.reicjs`. Modul batch 0006 mencakup Pengaturan Tampilan, Pusat Tema, Pusat Wallpaper, Pusat Aksesibilitas, dan Pusat Bahasa.

## Generator

`generate.mjs` membuat batch terbatas (maksimal 1.000 modul / 3.000 file per eksekusi) dan tidak menimpa file yang sudah ada (`flag: wx`). Contoh:

```sh
node generate.mjs --start 1 --count 100 --write
node generate.mjs --start 101 --count 100 --write
```

Jalankan dari direktori `vmdesktopreic/reic1500000` atau tentukan `--out`. Opsi `--write` wajib untuk menulis file; tanpa opsi tersebut generator hanya menampilkan rencana batch. Setiap batch perlu ditinjau, diuji, lalu dikomit terpisah. Jangan mencoba membuat seluruh 1,5 juta file sekaligus: ukuran Git, batas API, waktu build, dan performa GitHub Pages perlu dikelola.

## Batas integrasi

File fisik dan manifest telah ditambahkan ke repositori, tetapi keberadaan file tidak otomatis berarti modul sudah dimuat oleh desktop. Integrasi runtime, validasi browser, pengujian, dan pemeriksaan kinerja perlu dilakukan bertahap sebelum menyatakan semua modul aktif.
