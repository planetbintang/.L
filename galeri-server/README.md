# GALERI Backend — REIC Server

Backend Node.js 20 + PostgreSQL untuk akun GALERI dan penyimpanan berkas privat PlanetBintang. Skema data memakai kontrak .reic; runtime yang menjalankan API saat ini adalah Node.js, bukan interpreter REIC native.

## Status

Kode dan konfigurasi instalasi berada di branch io. Ini belum berarti server sudah online. GitHub Pages hanya menyajikan frontend statis; API, PostgreSQL, dan penyimpanan harus dipasang pada server PlanetBintang.

## Komponen

- src/server.mjs: REST API akun, sesi, profil, metadata file, upload, dan download.
- schema/galeri.reic: tabel PostgreSQL untuk users, profiles, sessions, folders, files, storage quotas, dan audit events.
- deploy/galeri.service: unit systemd dengan user service terpisah.
- deploy/nginx-galeri.conf: reverse proxy HTTPS.
- deploy/install.sh: instalasi dependensi, skema, dan service setelah konfigurasi server siap.
- .github/workflows/galeri-backend-ci.yml: pemeriksaan otomatis kode dan kontrak frontend.

## Instalasi pada server PlanetBintang

Persyaratan: Linux dengan systemd, Node.js 20+, PostgreSQL 14+, Nginx, domain API milik PlanetBintang, sertifikat TLS, dan akses administrator.

1. Checkout/salin branch io ke /opt/planetbintang; pastikan folder aplikasi berada di /opt/planetbintang/galeri-server.
2. Buat database dan role khusus aplikasi. Contoh (jalankan sebagai administrator PostgreSQL dan ganti password):
   ```sql
   CREATE ROLE galeri_app LOGIN PASSWORD 'GANTI_DENGAN_SECRET_KUAT';
   CREATE DATABASE planetbintang OWNER galeri_app;
   ```
3. Salin .env.example ke /etc/planetbintang/galeri.env. Isi DATABASE_URL, GALERI_STORAGE_DIR, ALLOWED_ORIGINS=https://planetbintang.github.io, COOKIE_SECURE=true, dan nilai rahasia yang benar. Jangan commit file env.
4. Pastikan /srv/planetbintang/galeri-data berada di luar web root. Jalankan sudo bash deploy/install.sh dari folder aplikasi. Script akan menerapkan schema, memasang dependensi produksi, dan mengaktifkan galeri.service.
5. Ganti api.example.com dan path sertifikat pada deploy/nginx-galeri.conf, aktifkan konfigurasi Nginx, lalu validasi dengan nginx -t dan reload Nginx.
6. Uji https://NAMA-DOMAIN-API/api/v1/health. Hasil yang diharapkan: JSON status: ok.
7. Pada halaman GALERI, masukkan origin HTTPS API (misalnya https://api.domain-anda.tld) di bagian Akun & Penyimpanan GALERI, lalu simpan. Setelah API terhubung, lakukan register/login dan coba unggah berkas kecil.

Catatan: domain API dan frontend GitHub Pages berbeda situs. Cookie sesi memakai SameSite=None; Secure; Partitioned untuk mendukung penyimpanan cookie terpartisi pada browser yang kompatibel. Kebijakan browser dapat berbeda; uji login dan refresh sesi pada Android serta desktop. Untuk dukungan lintas-browser yang paling konsisten, gunakan frontend dan API pada domain situs yang sama (mis. www.domain-anda.tld dan api.domain-anda.tld) dan masukkan origin frontend sebenarnya pada ALLOWED_ORIGINS.

## Deploy melalui GitHub Actions (opsional)

Workflow manual berada di .github/workflows/galeri-backend-deploy.yml dan hanya berjalan jika input confirm_production disetujui. Siapkan environment GitHub bernama production dan secrets berikut sebelum menjalankan workflow: GALERI_SSH_HOST, GALERI_SSH_USER, GALERI_SSH_PRIVATE_KEY, GALERI_SSH_KNOWN_HOSTS (host key yang sudah diverifikasi), dan GALERI_API_HEALTH_URL (URL HTTPS lengkap ke /api/v1/health). Akun SSH harus memiliki sudo non-interaktif untuk memasang service. File .env dan data database tidak dikirim dari GitHub. Workflow akan mengirim source, menjalankan installer, lalu memeriksa endpoint health. Jangan menyalakan workflow sebelum database, file environment, TLS, dan host key sudah disiapkan.

## API v1

- GET /api/v1/health
- POST /api/v1/register — email, password (min. 12 karakter), displayName
- POST /api/v1/login — membuat sesi HttpOnly
- POST /api/v1/logout
- GET /api/v1/me
- PUT /api/v1/profile
- GET /api/v1/files
- POST /api/v1/files — membuat metadata dan memperoleh uploadUrl
- PUT /api/v1/files/:id/content — upload raw body
- GET /api/v1/files/:id/content — unduh file milik akun sendiri

Frontend memakai credentials: include. Upload dilakukan dalam dua tahap: buat metadata, lalu kirim byte file ke uploadUrl. API membatasi kepemilikan file per akun.

## Keamanan sebelum produksi publik

- Jangan membuka registrasi publik sebelum verifikasi email, reset password, rate limiting, CSRF/origin protections yang sesuai, dan pemantauan abuse disiapkan.
- Tambahkan pemindaian malware/jenis berkas, kebijakan retensi, backup database + storage, dan uji pemulihan.
- Batasi ukuran upload di aplikasi dan reverse proxy; storage harus privat.
- Gunakan secret manager atau file environment dengan izin terbatas.
- Pantau log systemd dan rotasi sesi yang kedaluwarsa.
- Upload awal belum menyediakan folder CRUD, sharing, preview transcoding, maupun sinkronisasi File Manager global.
