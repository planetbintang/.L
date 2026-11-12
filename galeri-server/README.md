# GALERI Backend — REIC Server

Backend Node.js 20 + PostgreSQL untuk akun GALERI dan penyimpanan berkas privat PlanetBintang. Skema data memakai kontrak .reic; runtime yang menjalankan API saat ini adalah Node.js, bukan interpreter REIC native.

## Status

Kode dan konfigurasi instalasi berada di branch io. Ini belum berarti server sudah online. GitHub Pages hanya menyajikan frontend statis; API, PostgreSQL, dan penyimpanan harus dipasang pada server PlanetBintang.

## Komponen

- src/server.mjs: REST API akun, sesi, profil, metadata file, upload, dan download.
- schema/galeri.reic: migrasi PostgreSQL idempoten untuk users, roles, sessions, files, storage quotas, audit events, dan media workflow.
- scripts/set-role.mjs: provisioning peran admin/editor/member setelah akun dibuat.
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
5. Setelah akun pemilik dibuat melalui register, jalankan `set -a; source /etc/planetbintang/galeri.env; set +a; node scripts/set-role.mjs email-pemilik@domain.tld admin` dari direktori backend. Tambahkan editor dengan argumen role `editor`. Perintah ini harus dijalankan operator server yang memiliki akses DATABASE_URL.
6. Ganti api.example.com dan path sertifikat pada deploy/nginx-galeri.conf, aktifkan konfigurasi Nginx, lalu validasi dengan nginx -t dan reload Nginx.
7. Uji https://NAMA-DOMAIN-API/api/v1/health. Hasil yang diharapkan: JSON status: ok.
8. Pada halaman GALERI, masukkan origin HTTPS API (misalnya https://api.domain-anda.tld) di bagian Akun & Penyimpanan GALERI, lalu simpan. Setelah API terhubung, lakukan register/login dan coba unggah berkas kecil.

Catatan: domain API dan frontend GitHub Pages berbeda situs. Cookie sesi memakai SameSite=None; Secure; Partitioned untuk mendukung penyimpanan cookie terpartisi pada browser yang kompatibel. Kebijakan browser dapat berbeda; uji login dan refresh sesi pada Android serta desktop. Untuk dukungan lintas-browser yang paling konsisten, gunakan frontend dan API pada domain situs yang sama (mis. www.domain-anda.tld dan api.domain-anda.tld) dan masukkan origin frontend sebenarnya pada ALLOWED_ORIGINS.

## Deploy melalui GitHub Actions (opsional)

Workflow manual berada di .github/workflows/galeri-backend-deploy.yml dan hanya berjalan jika input confirm_production disetujui. Siapkan environment GitHub bernama production dan secrets berikut sebelum menjalankan workflow: GALERI_SSH_HOST, GALERI_SSH_USER, GALERI_SSH_PRIVATE_KEY, GALERI_SSH_KNOWN_HOSTS (host key yang sudah diverifikasi), dan GALERI_API_HEALTH_URL (URL HTTPS lengkap ke /api/v1/health). Akun SSH harus memiliki sudo non-interaktif untuk memasang service. File .env dan data database tidak dikirim dari GitHub. Workflow akan mengirim source, menjalankan installer, lalu memeriksa endpoint health. Jangan menyalakan workflow sebelum database, file environment, TLS, dan host key sudah disiapkan.

## API v1

- GET /api/v1/health
- POST /api/v1/register — email, password (min. 12 karakter), displayName
- POST /api/v1/login — membuat sesi HttpOnly
- POST /api/v1/logout
- GET /api/v1/me (termasuk role)
- GET /api/v1/admin/session — sesi admin/editor dan permission
- GET /api/v1/admin/media; POST /api/v1/admin/media — daftar/buat media
- PUT /api/v1/admin/media/:id/content — unggah berkas konten
- POST /api/v1/admin/media/:id/review — kirim draf ke antrean review
- POST /api/v1/admin/media/:id/publish — persetujuan Admin dan publikasi
- POST /api/v1/admin/media/:id/unpublish|archive|feature — kontrol Admin
- GET /api/v1/admin/activity — audit trail
- GET /api/v1/public/media — hanya media published dengan upload lengkap
- GET /api/v1/public/media/:id/content — konten publik yang sudah diterbitkan
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


## Peran dan alur publikasi

Registrasi umum selalu membuat akun dengan role `member`; klien tidak dapat memilih atau menaikkan perannya sendiri. Operator server mempromosikan akun setelah identitas pemilik diverifikasi:

```bash
set -a; source /etc/planetbintang/galeri.env; set +a
node scripts/set-role.mjs pemilik@domain.tld admin
node scripts/set-role.mjs editor@domain.tld editor
```

- **Admin:** kelola semua konten, menyetujui review, publish/unpublish, arsipkan, dan pilih sorotan.
- **Editor:** buat dan unggah konten, simpan draft, kirim ke review; tidak dapat mem-publish atau mengubah role.
- **Member:** akun penyimpanan biasa; tidak memiliki akses dashboard admin.

Alur wajib: `draft → review → published`. Konten tidak bisa dipublikasikan sebelum upload lengkap dan status review. Endpoint publik menjalankan query dengan filter `status='published' AND uploaded_at IS NOT NULL`; berkas draft/review/archived tidak memiliki jalur baca publik. File disimpan di `GALERI_STORAGE_DIR` di luar web root, sedangkan PostgreSQL menyimpan metadata dan status publikasi.

Sesudah deploy kode, migrasi `schema/galeri.reic` dijalankan installer. Untuk produksi, siapkan backup PostgreSQL dan folder storage, batasi izin direktori, aktifkan TLS, lalu uji peran Admin/Editor dan feed publik sebelum membuka dashboard kepada tim.
