# TODO — PlanetBintang GALERI Dashboard

## 1. Struktur GALERI Dashboard — selesai

- [x] Folder `.L/galeri/dashboard` ditambahkan.
- [x] Menu All Files, Photos, Videos, Movies, Shared, Favorites, dan Documents dibuat satu per satu dalam struktur proyek.
- [x] Manifest filesistem virtual mendukung nested folders, search, pagination 100 item, metadata, upload, rename, move, copy, download, soft-delete, dan sharing tanpa membuat ribuan file dummy di repository.
- [x] Dashboard terhubung sebagai sub-menu `GALERI → Dashboard` pada route `/galeri/dashboard`.

## 2. Registrasi, login, dan akses privat — selesai

- [x] Registrasi/login memakai Manus OAuth starter dan sesi aplikasi `webdev_app_session`.
- [x] Dashboard menampilkan gate login dan tidak membuka file manager bagi user anonim.
- [x] Query/mutasi file manager, upload URL, share, dan aktivitas memakai `protectedProcedure` serta owner/recipient checks.

## 3. Storage object yang bertumbuh — selesai

- [x] Objek media dan dokumen disimpan pada durable object storage backed by presigned S3; binary tidak ditulis ke filesystem server aplikasi.
- [x] Upload memakai presigned PUT langsung browser → object storage dengan progres/error state.
- [x] Storage key dan stable `/manus-storage/<key>` address disimpan di indeks database.
- [x] Kuota 500 GB ditegakkan server-side sebelum presigned upload URL dibuat.
- [x] Delete memakai soft-delete pada indeks; physical object deletion tidak dijanjikan karena runtime API tidak menyediakan operasi delete aplikasi.

## 4. Indeks file dan folder berskala besar — selesai

- [x] Folder bertingkat memakai parent ID; file menyimpan metadata nama, MIME, ukuran, tipe, storage key, status, owner, dan timestamps.
- [x] List/search dibatasi 100 item dan mendukung scope All Files, Photos, Videos, Movies, Favorites, Documents, serta Shared.
- [x] Create, open, rename, move, copy, download, favorite, dan soft-delete tersedia untuk file/folder milik owner.
- [x] Shared access memakai email penerima; penerima dapat melihat scope Shared dan mengunduh signed URL, sedangkan mutasi tetap dibatasi sesuai ownership.
- [x] Shared Items dan Collaboration Hub membaca share/activity index yang persisten.
- [x] Move folder menolak target descendant agar tree tidak membentuk siklus.

## 5. Antarmuka dashboard — selesai

- [x] Sidebar, global search, profil, profile summary, cloud storage breakdown, quick upload, recent media/folders, shared items, dan collaboration hub ditampilkan.
- [x] Pemilihan file dan drag-and-drop upload memiliki indikator progres serta feedback error.
- [x] Kartu file/folder menampilkan preview icon, nama, tipe, ukuran, waktu update, badge status, dan menu aksi.
- [x] Layout responsif pada desktop, tablet, dan mobile mengikuti arah visual MediaVault.

## 6. Validasi dan delivery — selesai

- [x] Route manifest tersedia di `GET /manus-routes.json`.
- [x] `pnpm check`, `pnpm test`, dan `pnpm build` lulus.
- [x] Server Preview menjawab `/api/health` dan manifest route.
- [x] Perubahan disiapkan untuk checkpoint canonical `origin/main`.

## Catatan operasional

Copy file/folder menggunakan hard-link metadata ke object bytes yang sama, bukan menggandakan bytes di storage. Soft-delete menyembunyikan indeks, sedangkan objek storage tetap durable. Penghapusan fisik dan garbage collection object orphan memerlukan operator storage terpisah.
