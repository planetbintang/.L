# REIC Kamus Digital — aktivasi backend

## Komponen yang sudah disiapkan

- `aireber/src/routes/api.kamus.ts`: endpoint akun, sesi, profil, koleksi kata, file, pengaturan, riwayat, dan audit.
- `aireber/db/schema.ts`: tabel PostgreSQL `reic_kamus_*`.
- `aireber/netlify/database/migrations/20261112091000_create_reic_kamus_tables/migration.sql`: migrasi tabel.
- `leksikon/reic-account.js`: adapter API bearer-token dan fallback IndexedDB.
- `leksikon/index.html`: konfigurasi API melalui `meta[name="reic-api-base"]`.
- File Kamus yang disimpan juga dicerminkan ke workspace File Manager pada browser yang sama melalui storage key `planetbintang.file-manager.workspace.v1` dan event `planetbintang:workspace-files-changed`.

## Aktivasi server

1. Deploy folder `aireber/` sebagai aplikasi Netlify. Folder tersebut sudah memiliki `netlify.toml`, build command `vite build`, dan publish directory `dist/client`.
2. Pastikan Netlify Database/PostgreSQL terpasang pada site tersebut dan migrasi REIC Kamus diterapkan.
3. Atur environment variable `REIC_ALLOWED_ORIGINS=https://planetbintang.github.io`. Tambahkan origin lain hanya bila benar-benar digunakan.
4. Ambil domain Netlify yang benar dari dashboard site. Jangan menebak nama subdomain.
5. Isi meta tag pada `leksikon/index.html` dengan origin HTTPS Netlify yang benar, tanpa path:
   `<meta name="reic-api-base" content="https://DOMAIN-NETLIFY-AKTUAL" />`
6. Uji `https://DOMAIN-NETLIFY-AKTUAL/api/kamus?action=health`. Hasil sehat harus berisi `ok: true` dan `storage: "netlify-postgres"`.

## Kontrak dan batasan keamanan

- Kata sandi diproses di server dengan PBKDF2-SHA512 dan salt acak; database hanya menyimpan hash.
- Token sesi acak dikembalikan saat login/register; yang disimpan di database hanya SHA-256 token.
- Semua query koleksi, file, riwayat, setting, dan audit dibatasi oleh ID pengguna yang berasal dari sesi terautentikasi.
- File teks dibatasi 5 MB dan disimpan di PostgreSQL. Penyimpanan objek untuk berkas biner besar belum diaktifkan.
- Mirror ke File Manager workspace menyatukan tampilan di browser/perangkat yang sama. Sinkronisasi langsung File Manager utama lintas perangkat memerlukan konfigurasi origin API dan adapter cloud pada aplikasi File Manager.
- Jika meta API masih kosong, halaman Kamus tetap menggunakan IndexedDB lokal. Jangan menyebut mode ini sebagai akun cloud.
