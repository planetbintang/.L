# Sistem URL dan Routing — VendorDomain

Workspace konfigurasi berlapis untuk 25 fitur URL dan routing.

## Lapisan
- Layout: susunan panel dan area kerja.
- Pilihan: pola URL, normalisasi, prioritas, dan fallback.
- Penerapan: uji dan susun aturan path/redirect.
- Penyimpanan: penyimpanan lokal browser serta impor/ekspor JSON.
- Sistem: manifest struktur folder dan file.
- Konfigurasi: status dan validasi konfigurasi.

## Penyimpanan dan batas penerapan
Draft aturan disimpan pada localStorage browser. Ekspor JSON menghasilkan berkas yang dapat ditinjau dan disimpan ke repositori. GitHub Pages merupakan hosting statis; perubahan routing server tidak aktif hanya karena status UI diubah. Untuk penerapan produksi, validasi konfigurasi lalu integrasikan dengan backend atau pipeline deployment.
