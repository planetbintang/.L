# Hosting ↔ File Manager data contract

File Manager adalah pusat manajemen metadata dan berkas seluruh modul Hosting, bukan tempat menyimpan kredensial autentikasi.

## Struktur tenant
- `/hosting/tenants/{tenant_id}/profile/` — metadata profil dan preferensi.
- `/hosting/tenants/{tenant_id}/services/` — referensi paket, layanan, resource, dan status.
- `/hosting/tenants/{tenant_id}/domains/` — domain, DNS, SSL, dan konfigurasi.
- `/hosting/tenants/{tenant_id}/websites/` — document root, deployment, dan artefak website.
- `/hosting/tenants/{tenant_id}/databases/` — metadata koneksi (tanpa password/secret).
- `/hosting/tenants/{tenant_id}/backups/` — metadata snapshot dan pemulihan.
- `/hosting/tenants/{tenant_id}/billing/` — invoice, penggunaan, dan bukti transaksi sesuai izin.
- `/hosting/tenants/{tenant_id}/activity/` — indeks aktivitas audit.

## Aturan sinkronisasi
1. Semua modul menggunakan `hosting_file_objects.id` dan `object_key` sebagai referensi kanonis.
2. Data terstruktur disimpan di tabel REIC/PostgreSQL; File Manager menampilkan, mengatur folder, izin, metadata, versi, dan riwayatnya.
3. File biner disimpan pada private object storage; database menyimpan metadata dan checksum.
4. Tenant dan izin selalu ditentukan server dari sesi login; browser tidak boleh memilih tenant_id sendiri.
5. Password, hash password, token sesi, API key, private key SSL, dan secret environment tidak boleh diekspor atau ditampilkan File Manager.
6. Aktivitas create/update/delete/download/deploy dicatat append-only dan diberi actor + timestamp.
7. Sinkronisasi lintas modul memakai API backend; localStorage hanya boleh untuk preferensi UI non-sensitif.

## Status implementasi
Kontrak REIC, skema SQL awal, dan klien frontend tersedia. Endpoint API, verifikasi email, penyimpanan objek, RLS/policy, provisioning server, dan konfigurasi rahasia harus diaktifkan pada backend sebelum autentikasi dan penyimpanan produksi dapat digunakan.
