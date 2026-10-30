# Pemetaan Root Sistem OS MEDIA VM

Pemetaan ini menjadi kontrak namespace root pada File Manager. Root sistem merupakan namespace aplikasi dan tidak mengklaim akses langsung ke partisi perangkat.

| Root | Fungsi | Kebijakan utama |
|---|---|---|
| `/acct` | Action, activity, activation, account | Event terstruktur, actor dan hasil; jangan simpan kredensial di log. |
| `/sys` | Sistem inti permanen | Hanya menerima hasil rekonstruksi yang tervalidasi dari `/system_ext` dan `/cache`. |
| `/system_ext` | Inventaris dan staging sistem/perangkat terdeteksi | Metadata minimum, izin eksplisit, tanpa secret; sumber untuk proses rekonstruksi. |
| `/cache` | Rekonstruksi sementara | Dapat dibersihkan, dibatasi kuota/umur, mengikuti kebijakan hemat baterai. |
| `/config` | Konfigurasi permanen milik pemilik | Owner-only, skema tervalidasi, audit dan versi cadangan. |
| `/media` | Aset publik hasil rilis | Hanya konten yang lolos validasi build, lisensi, keamanan, dan persetujuan publikasi. |
| `/data` | Data bersama terkoordinasi | Identitas data stabil, skema versi, klasifikasi, retensi, integritas dan aturan akses. |

## Alur rekonstruksi

1. Deteksi/inventaris yang diizinkan masuk ke `/system_ext` sebagai staging.
2. Tugas rekonstruksi diproses di `/cache`; tugas berat dapat ditunda saat mode hemat baterai aktif.
3. Validasi skema, izin, checksum, dependensi, dan kompatibilitas dilakukan sebelum promosi.
4. Hasil valid masuk ke `/sys` sebagai sistem inti permanen; hasil gagal dikarantina dan dicatat tanpa secret.
5. Build publik yang telah disetujui dipublikasikan ke `/media`.
6. Data bersama lintas modul mengikuti kontrak identitas dan tata kelola pada `/data`.

## Batasan runtime

GitHub Pages hanya menyajikan berkas statis. Folder virtual dan file map mendefinisikan perilaku File Manager di browser; sinkronisasi lintas pengguna, akses perangkat sungguhan, penyimpanan permanen server, dan kontrol pemilik memerlukan backend terautentikasi. Jangan menyimpan rahasia atau data pribadi sensitif dalam repositori publik.
