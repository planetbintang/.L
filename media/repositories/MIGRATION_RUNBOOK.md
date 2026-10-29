# Runbook migrasi repositori PlanetBintang

Tanggal inventaris: 2026-10-29. Sumber katalog: `index.json` (47 repositori).

## Keadaan nyata saat ini

- Entri katalog dan folder `filesystem/<nama>/README.md` adalah file Git nyata yang sudah dibuat untuk pengindeksan.
- Entri folder tersebut **bukan** salinan isi repositori.
- Tiga file sumber kecil tercatat di `imported/`; status rinci ada di `MIGRATION_STATUS.json`.
- Tidak ada bukti bahwa seluruh file, riwayat, tag, LFS, atau submodule sudah dipindahkan. Jangan menandai migrasi selesai sebelum verifikasi.

## Pengamanan wajib

1. Jangan menyalin 41 repositori privat ke pohon yang dipublikasikan GitHub Pages. Pages dapat membuat konten terbitan dapat diakses publik meskipun repositori sumber privat.
2. Tentukan repositori tujuan privat yang terpisah untuk konten privat, dengan akses yang setara.
3. Audit secret, token, data pribadi, lisensi, artefak build, LFS, submodule, dan ukuran sebelum menyalin.
4. Jangan gabungkan riwayat Git dengan menaruh folder `.git` bertingkat di dalam repositori induk. Untuk mempertahankan riwayat, gunakan mirror repo terpisah atau bundle.
5. `index.html.app` (sekitar 1.22 GiB) dan `al.l` (sekitar 288 MiB) perlu strategi arsip/LFS atau repo terpisah; jangan memaksakan seluruh isi ke GitHub Pages.

## Alur operasional di mesin yang memiliki Git dan GitHub CLI

Lakukan di lingkungan pemilik akun yang sudah terautentikasi (`gh auth status`). Jalankan per repositori, bukan paralel tanpa batas.

Untuk membuat mirror penuh yang mempertahankan refs/riwayat:
```sh
gh auth status
git clone --mirror https://github.com/planetbintang/NAMA.git
cd NAMA.git
git fsck --full
git bundle create ../NAMA.bundle --all
```

Simpan bundle/mirror privat untuk sumber privat. Untuk membuat salinan working-tree tanpa riwayat, clone ke direktori sementara lalu salin hanya setelah audit:
```sh
git clone https://github.com/planetbintang/NAMA.git /tmp/NAMA
# audit /tmp/NAMA terlebih dahulu
rsync -a --exclude='.git' /tmp/NAMA/ media/repositories/filesystem/NAMA/
```

**Jangan jalankan contoh rsync untuk repositori privat ke direktori yang dipublikasikan Pages.** Tentukan target privat terpisah terlebih dahulu. Jangan menggunakan placeholder `NAMA` secara literal.

## Syarat penutupan

Untuk setiap repo, catat commit sumber, visibilitas, target, jumlah file, total byte, hasil pemindaian secret, penanganan LFS/submodule, dan hasil checksum. Status baru boleh `complete` setelah pembandingan independen sukses dan deployment diperiksa.