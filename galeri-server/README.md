# GALERI Backend — REIC Server

Backend Node.js 20 + PostgreSQL untuk layanan akun GALERI dan penyimpanan file privat PlanetBintang.

## Status dan batas

Ini adalah runtime backend mandiri yang siap dipasang pada server PlanetBintang, bukan layanan yang berjalan di GitHub Pages. GitHub Actions hanya menjalankan pemeriksaan kode. Jangan mengarahkan pengguna produksi ke API sebelum server, TLS, database, reverse proxy, dan backup disiapkan.

## Instalasi server

1. Pasang Node.js 20+ dan PostgreSQL 14+ pada server.
2. Buat database dan user PostgreSQL khusus aplikasi dengan hak minimum.
3. Salin `.env.example` menjadi `.env`; isi DATABASE_URL, direktori storage privat, origin frontend, dan COOKIE_SECURE=true.
4. Jalankan `npm ci` setelah package-lock dibuat pada server, atau `npm install` untuk instalasi awal.
5. Terapkan skema: `psql "$DATABASE_URL" -f schema/galeri.reic`.
6. Jalankan `npm start` menggunakan systemd/PM2 dan reverse proxy HTTPS.
7. Pastikan direktori storage berada di luar web root, hanya dapat dibaca user service, dan dicadangkan secara berkala.

## API v1

- `GET /api/v1/health`
- `POST /api/v1/register` — email, password (min. 12 karakter), displayName
- `POST /api/v1/login` — membuat sesi HttpOnly
- `POST /api/v1/logout`
- `GET /api/v1/me`
- `PUT /api/v1/profile`
- `GET /api/v1/files`
- `POST /api/v1/files` — membuat metadata dan memperoleh uploadUrl
- `PUT /api/v1/files/:id/content` — upload raw body dengan Content-Length
- `GET /api/v1/files/:id/content` — unduh file milik akun sendiri

Frontend harus memakai `credentials: 'include'`. Untuk upload: buat metadata, lalu PUT byte file ke uploadUrl. Semua endpoint file memeriksa kepemilikan akun.

## Data REIC

Skema `schema/galeri.reic` membuat tabel users, profiles, sessions, folders, files, storage_quotas, dan audit_events pada schema PostgreSQL `galeri`.

## Keamanan dan pekerjaan sebelum produksi

- Gunakan HTTPS dan COOKIE_SECURE=true.
- Rahasia hanya di environment server/secret manager, bukan Git.
- Batasi request di reverse proxy; tambahkan rate limiting login, verifikasi email, reset password, CSRF token untuk deployment lintas-origin, pemindaian file, dan kebijakan retensi sebelum membuka pendaftaran publik.
- Upload awal disediakan sebagai endpoint raw PUT; folder CRUD dan sharing belum termasuk.
- Siapkan backup database dan file storage, uji pemulihan, monitoring, serta rotasi sesi.
- Jalankan migrasi database sebelum versi aplikasi baru.
