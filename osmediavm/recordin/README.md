# OS MEDIA VM — Recordin / REIC

Explorer REIC membaca katalog dari manifest atau daftar migrasi. REIC adalah format proyek; browser tidak menjalankannya secara native. Pratinjau antarmuka dijalankan melalui iframe terisolasi.

## Generator batch

Dari root repositori, gunakan Node.js 18+:

```sh
node scripts/generate-reic-batch.mjs --start 0 --count 51000
node scripts/generate-reic-batch.mjs --start 51000 --count 51000
```

Rentang indeks yang didukung adalah 0–1.499.999 (1.500.000 ID unik). Setiap berkas berisi header REIC, kategori, operasi, markup komponen, dan skema JSON. Generator menggunakan nama deterministik, tidak menimpa berkas yang sudah ada, serta membuat indeks JSON untuk setiap batch.

## Verifikasi dan batas

Target 1.500.000 adalah kapasitas indeks, bukan jumlah aktual. Periksa jumlah berkas fisik dan indeks batch sebelum menyatakan target tercapai. Jalankan batch terukur dan audit ukuran sebelum mengunggah; jangan mengirim 1,5 juta berkas dalam satu commit. Definisi yang dihasilkan berstatus spesifikasi dan memerlukan integrasi serta pengujian runtime sebelum disebut aktif.

Runtime statis: `index.html`, `recordin.css`, `recordin.js`, dan `manifest.json`. PHP memerlukan server PHP dan tidak berjalan pada GitHub Pages.
