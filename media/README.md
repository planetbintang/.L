# Planetbintang Media Root

Folder `/media/` berisi berkas nyata yang di-commit ke repositori `planetbintang/.L` dan menjadi katalog publik terpusat untuk sistem Planetbintang.

## Struktur

- `index.html` — landing page media dan identitas sistem.
- `planetbintang-system.json` — manifest identitas, kebijakan integritas, dan peta sumber repositori.
- `brand/IDENTITY.md` — aturan penggunaan identitas resmi.
- `repositories/README.md` — cara mengakses katalog repositori sumber.

## Sumber repositori

Seluruh repositori milik akun `planetbintang` tetap merupakan repositori GitHub yang terpisah. Katalog metadata agregat ada di `../data/repositories.json` dan cakupan sumber di `../data/repository-scope.json`. Folder ini tidak menyalin isi semua repo secara diam-diam: katalog saat ini mencakup 45 repositori dan sekitar 1.872.594 path metadata, termasuk 39 repo privat. Menyalin semua blob ke repo publik akan berisiko membocorkan kode privat, rahasia, dan data pengguna.

## Batas runtime

Berkas di folder ini nyata dan tersimpan di Git. GitHub Pages menyajikannya sebagai konten statis; ini bukan akses langsung ke filesystem perangkat atau server. Proteksi yang benar-benar mencegah perubahan memerlukan aturan branch/repository di pengaturan GitHub.