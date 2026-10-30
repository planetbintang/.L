# OS MEDIA VM — REIC Layout Library

Library ini menyediakan enam preset antarmuka: `dashboard`, `workbench`, `canvas`, `console`, `library`, dan `compact`.

## Integrasi komponen

1. Pilih preset pada `index.html`.
2. Atur properti dan ekspor definisi `.reic`.
3. Sertakan stylesheet pendamping `.reiccss` dan adapter `.reicjs` pada metadata header REIC.
4. Tempatkan markup komponen di area modul yang mendukung runtime REIC.

Header REIC menggunakan metadata `style:` dan `script:` agar Explorer REIC dapat memuat aset pendamping saat pratinjau. Adapter menandai root dengan `data-reic-mounted` dan memancarkan event `reic:layout-ready`.

Preset yang diterapkan melalui tombol **Terapkan preset** disimpan pada localStorage browser perangkat ini. Ekspor `.reic` menghasilkan definisi; file CSS/JS pendamping disediakan di direktori ini dan perlu disalin atau direferensikan sesuai struktur modul tujuan.

GitHub Pages hanya menyajikan aset statis. Penyimpanan lintas perangkat, akun, API, dan sinkronisasi server memerlukan backend terpisah.
