# PlanetBintang GALERI Dashboard

Aplikasi file manager PlanetBintang pada `.L/galeri/dashboard`, dibangun sebagai frontend React/Vite untuk GitHub Pages dan backend API terpisah pada REIC Server PlanetBintang.

## Fitur aplikasi

- Dashboard GALERI dengan login dan sesi akun.
- Upload langsung ke object storage melalui presigned URL.
- Indeks database untuk folder, file, kategori, pencarian, favorit, sharing, dan aktivitas.
- Menu All Files, Photos, Videos, Movies, Shared, Favorites, dan Documents.
- File manager responsif untuk desktop dan perangkat seluler.

## GitHub Pages

Workflow `.github/workflows/deploy-pages.yml` membangun frontend secara otomatis dan menyalin hasil Vite ke folder ini. URL publik:

`https://planetbintang.github.io/.L/galeri/dashboard/`

Vite menggunakan base path `/.L/galeri/dashboard/` agar seluruh JS, CSS, dan aset tetap ditemukan pada project Pages. Router menggunakan base path yang sama.

## Konfigurasi API produksi

Tambahkan GitHub Actions repository secrets berikut agar login dan operasi file tersambung ke backend:

- `GALERI_MANUS_PROJECT_ID`
- `GALERI_MANUS_OAUTH_PORTAL_URL`
- `GALERI_API_URL` — URL HTTPS backend GALERI, tanpa garis miring di akhir.
- `GALERI_API_BROWSER_KEY` — hanya kunci browser yang memang dirancang aman untuk dipublikasikan.

Backend harus menyediakan `/api/trpc`, `/api/oauth/start`, dan `/api/oauth/callback`, mengizinkan CORS dari origin `https://planetbintang.github.io` dengan credentials, serta menjalankan database dan object storage. Atur `GALERI_PUBLIC_API_URL` pada server ke URL publik backend yang sama dengan secret `GALERI_API_URL`; `MANUS_API_URL` tetap dipakai oleh konektor object storage dan bukan URL frontend API. Jangan menaruh password database, secret OAuth, access token privat, atau S3 secret di frontend maupun GitHub Pages.

Jika secrets API belum diisi, halaman frontend tetap dapat dibangun dan ditampilkan, tetapi login, database, dan upload belum aktif. GitHub Pages sendiri tidak menjalankan Express/tRPC atau menyimpan file privat.

## Pengembangan lokal

Jalankan `pnpm install`, `pnpm check`, `pnpm test`, dan `pnpm build:static` dari folder ini.
