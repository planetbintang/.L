# Rencana PlanetBintang — GALERI Dashboard

## Ruang lingkup

Membangun sub-menu **GALERI → Dashboard** pada `.L/galeri/dashboard`. Halaman hanya merender file manager setelah sesi Manus OAuth tervalidasi. Dashboard mengikuti acuan MediaVault dari pengguna: sidebar, pencarian, profil, ringkasan storage, quick upload, kartu folder/file, shared items, dan collaboration hub.

## Pendekatan implementasi

- **Autentikasi:** gunakan Manus OAuth starter yang sudah tersedia; semua prosedur file manager memakai `protectedProcedure`, sehingga user anonim tidak dapat membaca atau memodifikasi indeks.
- **Object storage:** gunakan durable object storage backed by presigned S3. Server hanya membuat presigned PUT dan memvalidasi metadata; browser mengunggah bytes langsung ke object storage. Aplikasi tidak menyimpan media di filesystem server/container.
- **Database:** tambahkan tabel folder, file, share, dan activity. Database menyimpan owner, parent folder, storage key, stable asset URL, ukuran, MIME, status soft-delete, dan timestamps. Navigasi memakai parent ID serta pagination/search agar tetap cocok untuk ratusan/ribuan objek.
- **Filesystem menu:** buat `.L/galeri/dashboard/` dengan folder menu All Files, Photos, Videos, Movies, Shared, Favorites, dan Documents. Folder ini adalah deklarasi/blueprint struktur UI; objek pengguna tetap berada di object storage dan indeks database.
- **API:** prosedur untuk bootstrap dashboard, list/search, create/rename/move/delete folder, create upload URL, register upload, download URL, dan soft-delete file. Upload dua langkah menjaga server bebas dari transfer bytes besar.
- **Frontend:** satu shell dashboard responsif dengan sidebar biru muda, header pencarian/profil, kartu ringkasan, breakdown progress, dropzone, recent folders/files, shared/collaboration panels, dan modal operasi folder/upload. Logged-out state menampilkan CTA login, bukan mock user.

## Desain

### Gaya yang dipilih: Cloud workspace minimal modern

**Design Movement:** modern SaaS cloud workspace dengan panel putih, radius lembut, dan warna biru langit yang ringan.

**Core Principles:** struktur cepat dipindai; storage terasa aman dan tenang; aksi utama selalu terlihat; kepadatan informasi meningkat tanpa kehilangan hierarki.

**Color Philosophy:** biru langit untuk navigasi dan rasa terhubung, navy untuk teks utama, hijau untuk kapasitas/aktivitas sehat, dan abu-biru pucat untuk permukaan sekunder.

**Layout Paradigm:** sidebar tetap sebagai jangkar; area utama memakai pita informasi horizontal lalu panel kerja asimetris untuk upload, recent items, dan kolaborasi.

**Signature Elements:** logo kubus planet, progress bar storage dua warna, dan kartu file dengan metadata ringkas serta badge Shared.

**Interaction Philosophy:** hover memperjelas target tanpa mengubah layout; folder dibuka dengan satu klik; aksi lanjutan berada di menu kontekstual; upload memperlihatkan status dan error yang dapat dipulihkan.

**Animation:** transisi 160–220ms untuk panel/kartu, progress upload bergerak halus, dan skeleton hanya saat request pertama.

**Typography System:** Inter/system sans; judul 30–36px semibold, section 18–20px semibold, label 12–14px medium, metadata 12px.

**Brand Essence:** pusat penyimpanan PlanetBintang yang rapi, aman, dan siap bertumbuh — tenang, terukur, kolaboratif.

**Brand Voice:** CTA seperti “Unggah ke PlanetBintang” dan status seperti “Ruang kerja Anda siap dipakai”.

**Wordmark & Logo:** kubus tiga sisi dengan titik orbit kecil, diikuti wordmark PlanetBintang.

**Signature Brand Color:** `#2563eb` sebagai biru orbit PlanetBintang.

## Struktur proyek

- `.L/galeri/dashboard/`: manifest struktur folder menu dan README filesistem virtual.
- `drizzle/schema.ts`: entitas folders, files, shares, activities.
- `server/db.ts`: query dan mutasi indeks file manager.
- `server/storage.ts`: presigned upload URL dan stable storage path.
- `server/routers.ts`: protected file manager API.
- `client/src/pages/GalleryDashboard.tsx`: halaman dashboard.
- `client/src/components/GalleryDashboardLayout.tsx`: shell GALERI dan auth gate.
- `client/src/index.css`: design tokens dan styling dashboard.
- `public/manus-routes.json`: route manifest `/` dan `/galeri/dashboard`.

## Batasan data

Media tidak dimasukkan ke Git atau filesystem container. Penghapusan file memakai soft-delete pada indeks karena runtime storage API tidak menyediakan physical delete untuk aplikasi. Stable `/manus-storage/<key>` disimpan di database; URL signed hanya dibuat saat aksi download bila dibutuhkan.
