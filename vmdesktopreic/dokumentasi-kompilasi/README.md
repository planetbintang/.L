# Generator Dokumentasi Kompilasi REIC

Jalankan `node scripts/generate-reic-documents.mjs` untuk membuat 1.500 dokumen Markdown berbahasa Indonesia di `vmdesktopreic/dokumentasi-kompilasi/`.

Dokumen disusun dalam 30 kategori, masing-masing 50 dokumen. Setiap dokumen memiliki judul unik dan struktur prosedur otomatisasi: tujuan, cakupan standar, masukan, prasyarat, alur, logika, validasi, pemulihan, keamanan, daftar uji, dan keluaran.

Workflow GitHub Actions `.github/workflows/reic-documentation.yml` menghasilkan serta menyimpan dokumen ke branch `io` saat generator ditambahkan/diubah atau dijalankan manual.

Catatan kompatibilitas: REIC/REICSS/REICJS divalidasi sesuai format; TypeScript/JSX memerlukan toolchain build; PHP memerlukan server dan tidak dieksekusi oleh GitHub Pages statis.
