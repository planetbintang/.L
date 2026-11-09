# Standar REIC Global — 1.500 Baris

Berlaku untuk seluruh repositori `.L/`, bukan hanya `vmdesktopreic/`.

## Ketentuan setiap komponen

Setiap `*.reic` harus memiliki dua modul pasangan dengan nama dasar yang sama:

- `*.reic`: deklarasi komponen, metadata, import/export, dependensi, dan entry point.
- `*.reicss`: seluruh gaya komponen, token, layout, state visual, dan aturan responsif.
- `*.reicjs`: implementasi perilaku, fungsi, event, lifecycle, integrasi, serta export API.

Target pengembangan adalah minimal **1.500 baris kode bermakna pada masing-masing dari ketiga file**. Baris kosong, komentar berulang, duplikasi, dan filler tidak dihitung sebagai implementasi. Import/export harus menunjuk modul yang benar-benar tersedia dan setiap implementasi harus relevan dengan komponen.

## Audit

Jalankan dari root checkout:

```bash
python3 scripts/check-reic-global-standard.py
python3 scripts/check-reic-global-standard.py --json > reic-global-audit.json
python3 scripts/check-reic-global-standard.py --strict
```

Audit memeriksa seluruh `.reic` di semua folder, pasangan `.reicss` dan `.reicjs`, jumlah baris, serta sintaks JavaScript. Mode default menghasilkan laporan tanpa menghentikan proses; `--strict` mengembalikan status gagal bila masih ada kekurangan.

## Integritas

Audit tidak menambahkan baris buatan, tidak menimpa kode, dan tidak membuat implementasi generik yang tidak sesuai fungsi komponen. File harus dikembangkan berdasarkan fungsi dan dependensi aktualnya. Karena cakupan dapat mencapai puluhan ribu file, implementasi massal perlu dilakukan bertahap dan diuji sebelum dipublikasikan.
