# Rencana migrasi repositori PLANETBINTANG

Status: PERENCANAAN — belum ada isi repositori yang disalin.

## Inventaris awal
- Snapshot katalog: 2026-10-29
- Total: 47 repositori
- Privat: 41
- Publik: 6
- Sumber kanonis dan riwayat Git harus dipertahankan.

## Gerbang keamanan wajib
1. Verifikasi izin akses dan tujuan penyimpanan tiap repositori.
2. Pindai rahasia, token, kunci, data pribadi, konfigurasi produksi, serta data pengguna.
3. Periksa lisensi, hak redistribusi, dependensi, submodule, Git LFS, dan riwayat commit.
4. Ukur ukuran aktual, jumlah berkas, file besar, dan batas GitHub Pages/repository.
5. Jangan menaruh isi privat di repositori atau situs publik. Gunakan penyimpanan privat terpisah untuk sumber privat.
6. Uji salinan, checksum, tautan relatif, build, dan deploy di staging sebelum rilis.

## Tahapan
A. Inventaris dan klasifikasi 47 repositori.
B. Audit akses, kerahasiaan, lisensi, ukuran, dan build.
C. Pilot satu repositori kecil yang disetujui.
D. Migrasi bertahap dengan log dan verifikasi setiap repositori.
E. Validasi File Manager, navigasi, dan deployment.
F. Rekonsiliasi akhir: jumlah repositori, file, checksum, pengecualian, dan status.

## Catatan ukuran awal
Katalog mencatat `planetbintang/index.html.app` sekitar 1,275,470 KB, `planetbintang/al.l` sekitar 295,067 KB, dan `planetbintang/.L` sekitar 118,413 KB. Ini adalah ukuran yang dilaporkan GitHub, bukan hasil pengukuran ukuran arsip ekspor. Ketiganya perlu analisis khusus sebelum salin.

## Kriteria selesai
Migrasi baru dinyatakan selesai jika setiap repositori memiliki hasil audit, tujuan penyimpanan yang disetujui, catatan salin, verifikasi integritas, dan status deployment. Folder indeks atau tautan saja tidak dihitung sebagai salinan isi.