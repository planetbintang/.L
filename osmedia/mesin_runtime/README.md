# Inti Runtime OS MEDIA VM

## Tujuan
Fondasi runtime web modular untuk aplikasi sistem. Seluruh label, deskripsi, alias, dan panduan antarmuka ditulis dalam bahasa Indonesia.

## Berkas inti
- `inti-runtime.js`: fungsi dasar untuk membaca manifes dan mengamankan teks tampilan.
- `daftar_aplikasi.js`: katalog 1.000 aplikasi sistem beserta alias, kategori, dan alamat berkas.
- `../pusat_aplikasi/index.html`: antarmuka pencarian, penyaringan, halaman demi halaman, dan rincian aplikasi.
- `../berkas_sistem/`: manifes JSON terpisah untuk tiap aplikasi.

## Batas runtime
Saat ini runtime berjalan di peramban sebagai situs statis. Membaca manifes dan membuka rincian aplikasi sudah didukung. Menjalankan proses sistem operasi, mengelola DNS, mengakses perangkat, atau memulai layanan peladen membutuhkan layanan dan izin tambahan; katalog tidak mengaktifkan layanan tersebut dengan sendirinya.

## Jenis berkas
Berkas inti menggunakan ekstensi yang juga dijumpai pada AI Reber, seperti HTML, JavaScript, CSS, JSON, Markdown, TypeScript, SQL, SVG, dan TXT. Berkas aplikasi saat ini menggunakan JSON sebagai format manifes yang aman dibaca oleh runtime statis.
