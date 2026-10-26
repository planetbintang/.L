# Planetbintang Control Center

Control Center menambahkan lima ruang kerja ke root dashboard `.L`: Repository Hub, Media & Document Center, System Integration, Sync & Deployment Center, dan Insights & Growth.

## Media & Document Center

- Mendukung pemilihan multi-file untuk gambar, audio, video/film, PDF, teks, dan format dokumen umum.
- Menyimpan berkas sebagai Blob pada IndexedDB browser; berkas tidak dikonversi ke Base64 dan tidak diunggah otomatis.
- Mendukung pratinjau gambar/audio/video dan PDF pada browser yang mendukung, unduh berkas, serta penghapusan salinan lokal.
- Ukuran maksimal praktis ditentukan oleh kuota browser/perangkat. Untuk berkas besar, browser bisa menolak transaksi karena kuota; UI menampilkan kegagalan tanpa mengklaim berhasil.
- Penyimpanan bersifat lokal untuk origin/browser/perangkat tersebut, bukan sinkronisasi cloud atau backup.

## Repository, integration, deployment

- Repository Hub menggunakan katalog repositori, File Manager, Enterprise Map, dan tautan GitHub yang telah ada.
- System Integration menunjukkan perbedaan antara UI/metadata snapshot dan konektor live.
- Sync & Deployment Center menyediakan checklist rilis lokal dan tautan resmi GitHub Actions/Deployments.
- GitHub Pages adalah frontend statis. Jangan menaruh PAT/token di source JavaScript. Push file langsung dari browser memerlukan otorisasi yang aman; gunakan GitHub Actions atau backend terautentikasi untuk operasi tulis.

## Insights & Growth

- Statistik dihitung dari metadata snapshot yang benar-benar tersedia.
- Catatan prioritas disimpan di localStorage browser saat ini.
- Ekspor JSON menghasilkan file lokal; tidak mengirim data ke layanan pihak ketiga.

## Routes

- `#control/repository-hub`
- `#control/media-center`
- `#control/system-integration`
- `#control/sync-deploy`
- `#control/insights-growth`
