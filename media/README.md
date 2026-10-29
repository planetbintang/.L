# Planetbintang Media Root

Folder `/media/` berisi berkas nyata yang di-commit ke repositori `planetbintang/.L`. Folder ini menjadi pusat indeks, dokumentasi, dan rujukan resmi sistem Planetbintang.

## Struktur

- `index.html` — halaman awal katalog media.
- `planetbintang-system.json` — identitas kanonis, aturan integritas, dan peta sumber.
- `repositories/index.json` — manifest metadata repositori Planetbintang yang terdeteksi saat snapshot dibuat.
- `repositories/README.md` — cara membaca indeks dan batas sinkronisasi.
- `brand/IDENTITY.md` — kebijakan penggunaan identitas resmi.
- `STRUKTUR.md` — rancangan direktori, sumber kebenaran, dan pemeliharaan.

## Cakupan manifest

Snapshot dibuat pada 2026-10-29 dari daftar repositori yang dapat diakses integrasi GitHub untuk pemilik `planetbintang`: **47 repositori** (41 privat, 6 publik pada saat pengambilan). Manifest memuat nama, URL sumber, branch default, visibilitas, status arsip, dan ukuran metadata GitHub. Manifest bukan salinan isi file atau riwayat Git dari tiap repositori. Daftar ini mencerminkan repositori yang terlihat oleh koneksi saat itu, bukan jaminan bahwa semua repositori yang mungkin ada di luar izin koneksi telah terdeteksi.

Repositori sumber tetap menjadi sumber kebenaran masing-masing. Indeks ini tidak mengubah atau memindahkan repositori asli. Tautan ke repositori privat hanya dapat dibuka oleh akun yang memiliki izin. Jangan menerbitkan manifest ini ke hosting publik tanpa meninjau kebijakan privasi, karena nama repositori privat juga termasuk metadata.

## Logo dan identitas

Halaman saat ini mempertahankan rujukan aset brand yang sudah ada. Perubahan atau penggantian logo ditunda sampai aset logo putih yang baru diunggah dan dikonfirmasi. Jangan membuat logo pengganti sementara.

## Batas runtime dan perlindungan

Berkas dalam folder ini tersimpan secara nyata di Git. GitHub Pages hanya menyajikan konten statis; folder ini tidak otomatis menjadi filesystem perangkat atau server. Untuk membatasi perubahan, aktifkan ruleset/branch protection di GitHub, wajibkan review, dan batasi bypass. Dokumen ini sendiri tidak dapat mengunci repository secara teknis.
