# File Manager PLANETBINTANG — repositori sumber

Direktori ini menyimpan entri Git nyata untuk repositori yang tercatat pada katalog pusat.

- Katalog sumber: [../index.json](../index.json)
- Status migrasi: [../MIGRATION_STATUS.json](../MIGRATION_STATUS.json)
- Rencana migrasi: [../../MIGRATION_PLAN.md](../../MIGRATION_PLAN.md)

Setiap subfolder repositori memiliki README metadata dan tautan ke sumber kanonis. Entri folder ini merupakan struktur penyimpanan nyata dalam Git, tetapi tidak berarti semua isi dari setiap sumber sudah disalin.

## Aturan keamanan

- Jangan menyalin isi 41 repositori privat ke repositori publik.
- Audit rahasia, data pribadi, lisensi, dependensi, Git LFS, submodule, ukuran, dan build sebelum migrasi isi.
- Pertahankan sumber kanonis sampai salinan diverifikasi.
- Tandai migrasi lengkap hanya setelah daftar file, checksum, riwayat yang dibutuhkan, dan deployment diverifikasi.

## Status

Migrasi tahap ini membuat entri direktori File Manager. Pemindahan penuh seluruh isi dan riwayat 47 repositori masih belum selesai.