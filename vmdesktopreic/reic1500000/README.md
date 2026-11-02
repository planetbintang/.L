# VMDESKTOPREIC — 1.500.000 FILE SYSTEM

Target fisik: **1.500.000 file** yang dibagi menjadi 500.000 modul; setiap modul memiliki `index.reic`, `index.reicss`, dan `index.reicjs`.

Generator `generate.mjs` membuat batch terbatas (maksimal 1.000 modul / 3.000 file per eksekusi) dan tidak menimpa file yang sudah ada (`flag: wx`). Contoh:

```sh
node generate.mjs --start 1 --count 100 --write
node generate.mjs --start 101 --count 100 --write
```

Jalankan dari direktori `vmdesktopreic/reic1500000` atau tentukan `--out`. Opsi `--write` wajib untuk menulis file; tanpa opsi tersebut generator hanya menampilkan rencana batch. Setiap batch perlu ditinjau, diuji, lalu dikomit terpisah. Jangan mencoba membuat seluruh 1,5 juta file sekaligus: ukuran Git, batas API, waktu build, dan performa GitHub Pages perlu dikelola.

**Status awal:** generator dan panduan telah ditambahkan. Generator belum dijalankan, sehingga belum ada klaim bahwa 1.500.000 file fisik telah dibuat. File yang dihasilkan juga belum otomatis dimuat oleh desktop; integrasi runtime dan pengujian perlu dilakukan per batch.
