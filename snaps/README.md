# PLANETBINTANG SNAPS — OS Platform

SNAPS (System Nexus for Automated Programming & Storage) menjadi control plane PlanetBintang untuk persiapan VMDESKTOPREIC sebagai OS mandiri.

## Status implementasi

- **SNAPS OS Installer:** tahap pemeriksaan perangkat (read-only) tersedia.
- **Target pertama:** perangkat Android yang dilaporkan sebagai vivo 1904.
- **Kernel, device tree, vendor blobs, recovery, dan boot image:** belum tersedia/terverifikasi untuk target ini.
- **Instalasi pengganti Android:** **BELUM SIAP**. Tidak ada proses unlock, erase, partition, atau flash otomatis dalam tahap ini.

GitHub Pages dan JavaScript browser tidak memiliki hak istimewa untuk mengganti OS perangkat. Pemeriksaan perangkat dijalankan dari komputer Linux/macOS dengan Android Platform Tools (ADB), atau dari lingkungan terminal yang memang memiliki ADB. Perintah pada ponsel biasa tidak dapat mengganti kernel/bootloader hanya karena dijalankan dari halaman web.

## Struktur

- `os-installer/` — pemeriksaan awal dan alur installer.
- `device-compatibility/` — profil target dan bukti kompatibilitas.
- `boot/` — spesifikasi boot chain; belum ada image flashable.
- `kernel/` — status kernel, konfigurasi, dan driver.
- `recovery/` — persyaratan backup dan pemulihan.
- `os-migration/` — gerbang migrasi dan kriteria rilis.
- `terminal/` — perintah penggunaan SNAPS.

## Pemeriksaan pertama

Dari komputer yang memiliki ADB:

```bash
bash snaps/os-installer/check-vivo-1904.sh
```

Skrip hanya membaca properti perangkat dan menyimpan laporan lokal. Skrip tidak meminta root, tidak membuka bootloader, tidak mengubah partisi, dan tidak mengirim data ke server.

## Gerbang sebelum instalasi OS

SNAPS hanya boleh menawarkan instalasi pengganti OS setelah seluruh bukti berikut tersedia dan ditinjau:

1. Identitas model, codename, SoC, arsitektur, dan revisi board terkonfirmasi.
2. Sumber kernel dan konfigurasi build yang cocok dengan perangkat.
3. Device tree dan seluruh driver penting (display, touch, storage, USB, Wi-Fi, audio, modem, kamera, sensor, charging) tervalidasi.
4. Vendor firmware/blobs yang legal dan kompatibel tersedia.
5. Bootloader dan skema partisi diketahui secara pasti.
6. Image boot/recovery dibangun dan diuji tanpa menimpa sistem utama.
7. Backup yang dapat dipulihkan serta prosedur unbrick tersedia.
8. Pengujian boot, jaringan, panggilan darurat, pengisian daya, suhu, dan stabilitas lulus.

**Jangan jalankan perintah fastboot flash/erase, format, repartition, atau unlock berdasarkan asumsi model.** Profil vivo 1904 saat ini adalah target pemeriksaan, bukan bukti bahwa image OS sudah kompatibel.
