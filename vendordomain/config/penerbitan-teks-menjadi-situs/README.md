# Konfigurasi Penerbitan Teks Menjadi Situs

Ruang konfigurasi khusus VendorDomain Modul 06.

- Pusat antarmuka: `index.reic` (keluaran web `index.html`).
- Cakupan fitur: 126–150 (25 profil).
- Cakupan submenu: 15 submenu per profil.
- Lapisan konfigurasi: `layout`, `pilihan`, `penerapan`, `penyimpanan`, `sistem`, dan `konfigurasi`.
- Setiap profil fitur disimpan pada `{id}/profile.json`.
- Setiap submenu mempunyai folder sistem yang tercatat pada properti `sistem.folder`, beserta berkas logis `layout.json`, `choices.json`, `applied.json`, `storage.json`, dan `config.json`.

## Penyimpanan dan penerapan

Antarmuka menyimpan perubahan sesi ke penyimpanan lokal browser dan menyediakan ekspor JSON. Profil bawaan yang menjadi sumber konfigurasi tersimpan di repositori. Ekspor konfigurasi dapat ditinjau dan dikomit kembali ke folder profil untuk sinkronisasi permanen; antarmuka statis tidak menulis langsung ke GitHub tanpa layanan backend/otorisasi.

Sumber halaman menggunakan format `.reic`; keluaran halaman web menggunakan `.html`.
