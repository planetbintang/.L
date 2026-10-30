# Vendor dan Reseller — Konfigurasi

Struktur konfigurasi berlapis untuk 25 profil menu.

- `schema.json`: skema dan daftar namespace menu.
- `menu-XX/config.reic.json`: profil konfigurasi gabungan per menu.
- `menu-XX/layout.json`: pilihan layout.
- `menu-XX/pilihan.json`: pilihan komponen dan visual.
- `menu-XX/penerapan.json`: metadata penerapan.
- `menu-XX/storage.json`: kebijakan penyimpanan dan versi.

Konfigurasi yang disimpan dari halaman web saat ini menggunakan penyimpanan browser lokal. Ekspor JSON dapat dipindahkan ke folder ini dan dikomit ke repositori. Sinkronisasi otomatis ke GitHub memerlukan API/backend dan otorisasi yang belum disediakan oleh halaman statis.
