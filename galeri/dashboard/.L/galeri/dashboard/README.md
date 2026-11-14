# PlanetBintang GALERI Dashboard

Struktur ini adalah blueprint filesistem untuk menu GALERI Dashboard. Objek media dan dokumen tidak disimpan di repository; bytes disimpan di durable object storage melalui presigned S3 upload. Database PlanetBintang menyimpan indeks, parent folder, metadata, kuota, dan aturan berbagi.

## Menu

- `all-files/` — seluruh file aktif milik akun
- `photos/` — gambar/foto
- `videos/` — video pendek
- `movies/` — film atau video berukuran besar
- `shared/` — objek yang dibagikan
- `favorites/` — objek favorit
- `documents/` — dokumen dan kode

Folder ini bukan tempat menaruh file binary runtime. Ia menjadi deklarasi struktur menu dan kontrak filesistem virtual yang dapat menampung ratusan sampai ribuan item melalui indeks terpaginasikan.
