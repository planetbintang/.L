# Konfigurasi Keamanan dan Kepatuhan VendorDomain

Workspace UI: `../security-compliance/index.html`

Modul ini mencakup 25 fitur ID 451–475. Setiap fitur memiliki profil konfigurasi browser terpisah dengan enam lapisan:
1. Layout — preset tampilan, navigasi, kepadatan, aksen.
2. Pilihan — profil kebijakan, tingkat risiko, cakupan, mode, pengecualian.
3. Penerapan — lingkungan, strategi, rollback, catatan.
4. Penyimpanan — format arsip, versi, retensi, enkripsi arsip.
5. Folder & File — rancangan direktori dan manifest per fitur.
6. Konfigurasi — nama profil, pemilik, referensi kontrol, catatan kebijakan.

## Penyimpanan dan batas operasi

- Profil aktif disimpan di `localStorage` browser dengan kunci `pb-vd-security-<ID>`.
- Impor dan ekspor menggunakan JSON.
- Jalur folder yang ditampilkan UI merupakan rancangan struktur repositori; UI tidak menulis file ke GitHub atau server.
- Tombol penerapan hanya menjalankan validasi/simulasi lokal. Pemindaian keamanan nyata, firewall, DDoS, enkripsi server, audit terpusat, dan kepatuhan produksi membutuhkan backend, kredensial aman, serta integrasi penyedia.
- Jangan masukkan password, private key, token API, atau rahasia produksi ke konfigurasi frontend.
