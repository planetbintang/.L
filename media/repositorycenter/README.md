# Pusat Repositori PlanetBintang

Pusat ini menyimpan katalog nama repositori dan generator paket aplikasi yang ditujukan untuk integrasi ke VMDESKTOPREIC.

## Sumber daya

- [Katalog 500 nama repositori](./repositorynames.md)
- [Generator 500 paket terintegrasi](./createintegratedpackages.sh)
- [Generator repositori dasar](./createrepositories.sh)

## Kontrak paket VMDESKTOPREIC

Setiap repositori yang dihasilkan generator paket memiliki:
- `manifest.json`: identitas paket, versi API, entry point, stylesheet, ikon, izin, dan kemampuan.
- `package.json`: metadata paket dan perintah pemeriksaan.
- `src/index.js`: lifecycle `createApp`, `mount`, `unmount`, dan status.
- `src/styles.css`: gaya yang mengikuti token tema host.
- `assets/icons/app.svg`: ikon aplikasi.
- `docs/integration.md`: kontrak integrasi, keamanan, dan lifecycle.
- `tests/package.test.js`: pemeriksaan dasar.

Host VMDESKTOPREIC tetap perlu menyediakan package loader, validasi manifest, sandbox/isolasi, permission enforcement, serta event bridge yang sesuai. Paket starter tidak mengasumsikan akses istimewa.

## Status

Generator sudah tersimpan pada branch `io`. Penyimpanan skrip bukan berarti 500 repositori sudah dibuat. Pembuatan dan push paket berlangsung ketika generator dijalankan dengan GitHub CLI yang terautentikasi dan memiliki izin membuat repositori publik di akun `planetbintang`.
