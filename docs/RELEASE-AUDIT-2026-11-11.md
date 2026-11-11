# Audit & catatan rilis — 11–12 November 2026

## Cakupan dan baseline

Audit dilakukan pada repository publik [`planetbintang/.L`](https://github.com/planetbintang/.L), branch sumber `io`, dengan halaman di [planetbintang.github.io/.L](https://planetbintang.github.io/.L/). Pekerjaan ini memulihkan route inti dan menambahkan observability HTTP browser-side; ini bukan penulisan ulang ratusan ribu halaman atau bukti bahwa layanan backend/provider telah aktif.

GitHub Pages API saat audit melaporkan `build_type: legacy`, branch `io`, path `/`, dengan HTTPS diwajibkan. Workflow `Deploy Planetbintang REIC to GitHub Pages` pada [run 42739943474](https://github.com/planetbintang/.L/actions/runs/42739943474) berstatus sukses dan log menyatakan 237.081 keluaran HTML dibangun dari 237.346 sumber REIC. Namun probe HTTP `HEAD` ke 20 target yang dipantau sebelum patch mendapatkan 12 respons 2xx dan 8 respons 404: `/monitoring/`, Katalog Git, Feature Workbench, GitHub Operations, VendorDomain Enterprise, `/airz/`, `/media/`, dan Pusat Pengembangan.

Snapshot sumber terakhir yang ditemukan memiliki timestamp `2026-10-23T07:13:34Z`, melewati ambang freshness 36 jam. Katalog repositori mentah di repository memuat metadata yang oleh README Media Root ditandai dapat mencakup repository privat; halaman baru karena itu tidak menautkan manifest tersebut. File sumber yang sudah berada di repository publik tetap memerlukan tinjauan privasi tersendiri.

## Perubahan pada tahap ini

- Menambahkan `/monitoring/` dengan tabel 20 target, filter, polling HTTP tiap 60 detik saat tab terlihat, timeout 12 detik, dan fallback `GET Range` hanya bila server menolak `HEAD`. Probe same-origin, tanpa kredensial, tidak mengikuti redirect agar tetap di subpath Pages, read-only, dan hasilnya tidak disimpan setelah tab ditutup.
- Menambahkan `build-public-monitor-status.py` dan `monitoring/snapshot-status.json`. Pipeline hanya menerbitkan tiga field skema/timestamp untuk status kesegaran; browser monitor tidak mengunduh atau menautkan daftar inventaris repositori mentah.
- Memulihkan indeks statis `/airz/` dan `/media/`. Media Root kanonis menahan tautan ke manifest yang dapat memuat metadata repository privat sambil menunggu review privasi.
- Menambahkan keluaran HTML byte-identik dengan sumber REIC untuk Media Root, Pusat Pengembangan, VendorDomain Enterprise, Katalog Git, Feature Workbench, dan GitHub Operations.
- Memperbaiki dua batas stylesheet di `feature-workbench.reic`, lalu menyinkronkan keluaran HTML-nya.
- Menyelaraskan route manifest, registry sistem, sitemap, dan pipeline Pages. CI membangun status snapshot yang direduksi, memvalidasi rute, memeriksa permukaan katalog/operasi, lalu membangun artefak Pages.

## Validasi pra-publikasi

Pada checkout kerja: `node --check` untuk JavaScript monitor; parsing JSON; validator monitor untuk 20 target; validator production surface untuk 1.500 spesifikasi fitur unik dan 30 modul; parsing sitemap XML; enam pasangan REIC/HTML identik byte demi byte; cek jumlah tag stylesheet; serta HTTP lokal 200 untuk sepuluh halaman/berkas inti. Hasil pemeriksaan itu bersifat lokal dan tidak menggantikan hasil workflow GitHub atau pemeriksaan URL setelah publikasi.

## Batas operasional dan langkah berikutnya

Konfigurasi Pages masih mode `legacy`; perubahan konfigurasi sumber Pages tidak dilakukan di patch ini. Route inti yang memiliki HTML eksplisit dapat disajikan oleh branch, tetapi suksesnya workflow tidak membuktikan seluruh hasil generator REIC telah tersedia pada URL publik. Untuk menyajikan seluruh keluaran tanpa meng-commit ratusan ribu duplikat HTML, pemilik repo perlu meninjau dan menyetujui pemindahan Pages ke mode `workflow`.

Monitor hanya menguji keterjangkauan HTTP dari browser, bukan kesehatan JavaScript, database, DNS provider, backend, workflow, atau akun. Pemantauan 24/7, histori terpusat, dan alert memerlukan layanan server-side terpisah dengan endpoint health yang minim informasi. Snapshot perlu diperbarui oleh job/API sumber yang berwenang; status tampilan tidak mengarang data terbaru.

## Sumber pemeriksaan

- Repository: <https://github.com/planetbintang/.L>
- GitHub Pages: <https://planetbintang.github.io/.L/>
- Workflow yang diaudit: <https://github.com/planetbintang/.L/actions/runs/42739943474>
- Spesifikasi rekonstruksi: <https://raw.githubusercontent.com/planetbintang/.L/io/REKONSTRUKSI-SISTEM.md>
- Peta root: <https://raw.githubusercontent.com/planetbintang/.L/io/SYSTEM-ROOT-MAP.md>
- Registry file: <https://raw.githubusercontent.com/planetbintang/.L/io/SYSTEM-FILE-REGISTRY.md>
