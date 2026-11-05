# SNAPS OS Installer

Installer tahap awal untuk VMDESKTOPREIC pada target vivo 1904.

## Yang tersedia sekarang

`check-vivo-1904.sh` menjalankan pemeriksaan ADB non-destruktif dari komputer host dan menghasilkan laporan lokal. Hasil pemeriksaan dipakai untuk menentukan apakah perangkat cocok dijadikan target pengembangan.

## Yang belum tersedia

Belum ada installer bootable, kernel REIC, recovery image, device tree tervalidasi, vendor image, atau paket OS yang siap dipasang. Karena itu, perintah instalasi/penggantian Android belum disediakan.

## Menjalankan

1. Pasang Android Platform Tools dari sumber resmi.
2. Aktifkan USB debugging hanya untuk pemeriksaan ini dan setujui komputer tepercaya.
3. Hubungkan satu perangkat melalui USB.
4. Jalankan:

```bash
bash snaps/os-installer/check-vivo-1904.sh
```

5. Tinjau laporan `snaps-vivo-1904-report-*.txt` sebelum memutuskan langkah pengembangan berikutnya.

Skrip berhenti jika ADB tidak tersedia, perangkat tidak terhubung, lebih dari satu perangkat terdeteksi, atau model tidak cocok. Tidak ada perintah tulis ke perangkat.
