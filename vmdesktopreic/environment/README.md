# REIC Environment Menu Catalog

VMDESKTOPREIC memiliki katalog **25.000 menu environment** yang dipasang sebagai satu runtime browser-safe. Katalog ini berada di `menu-catalog-25000.json`, berisi 25 kategori dengan 1.000 menu per kategori.

Launcher `⌘ ENVIRONMENT 25.000 MENU` tersedia pada menu inti desktop dan topbar. Pengguna dapat mencari ID/menu/kategori, memfilter kategori, membuka detail, menjalankan preview, dan menyalin ID menu.

Semua entri menggunakan `execution: "preview"` secara default. Perubahan konfigurasi tidak diklaim sebagai perubahan sistem host. Aksi tulis memerlukan adapter yang direview, izin `environment.configure`, dan integrasi backend terautentikasi.

Untuk membangun ulang katalog setelah mengubah taxonomy, jalankan dari root repository:

```bash
python3 scripts/generate-environment-menu-catalog.py
```

Validasi dasar:

```bash
node --check vmdesktopreic/environment/menu-catalog.js
python3 -m json.tool vmdesktopreic/environment/menu-catalog-25000.json >/dev/null
```
