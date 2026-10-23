# Planetbintang Root System

Dashboard publik utama untuk workspace repositori Planetbintang: **https://planetbintang.github.io/.L/**. Ikon brand yang diberikan pemilik dipakai sebagai ikon PWA dan pusat Snapshot Hub. Alias root yang ditampilkan adalah `.` → `planetbintang/`.

## Dashboard utama

- Mengindeks daftar 45 repo yang dipilih di `data/repository-scope.json`, dengan nama dan tautan repo privat ditampilkan publik sesuai instruksi pemilik.

- Menyediakan pencarian dan filter visibilitas/jenis aplikasi.

- Memetakan branch, SHA commit, status Pages/domain, host dan DNS IP publik, tipe aplikasi, dan pohon file Git bertingkat pada scope repo tetap.

- File Manager membuka path `/` untuk tiap repo, menavigasi breadcrumb folder, mencari item yang sedang dimuat, dan menampilkan kartu item tepat 40×60 px. Folder besar dimuat per halaman hingga 500 item.

- Penilaian statis menampilkan status cakupan pohon, Git tree SHA, mode executable, ukuran jika tersedia, bahasa, commit terakhir, serta kandidat entry point/manifest. Ini pemeriksaan struktur saja, bukan audit keamanan.

- Menampilkan trafik repo agregat GitHub untuk jendela hingga 14 hari jika tersedia; bukan analytics pengunjung situs.

- Panel Pengaturan menampilkan alias root, status sumber GitHub, status snapshot, opsi tema lokal, dan kebijakan privasi.

- Menu workspace menambahkan papan Proyek/Kanban, Issues lokal dengan komentar dan status, Code workspace, Analitik snapshot, Pengaturan akun lokal, pusat Bantuan, serta toolbox AI.

- Setiap menu header membuka satu view tersendiri; header tetap melekat dan navigasi tetap dapat digeser pada layar kecil. Route menu workspace, File Manager, repositori, domain/host, dan Sistem dapat dibuka lewat hash URL.

- Ikon logo header maupun hero membuka Snapshot Hub. Tombolnya mengambil ulang snapshot publik yang telah diterbitkan lalu menyegarkan Dashboard, Workspace, dan File Manager dari snapshot bersama yang sama; tombol itu tidak menjalankan workflow Actions.

- Tugas, masalah, profil, permintaan AI, dan draft kode disimpan di `localStorage` browser saat ini; data tersebut tidak disinkronkan ke GitHub. Analitik dihitung dari snapshot metadata repositori dan trafik GitHub agregat jika tersedia.

- Code workspace memuat source file publik dari `raw.githubusercontent.com` untuk ditinjau di browser. Repo privat tidak diambil; draft dapat disimpan lokal atau diunduh. Aksi simpan tidak melakukan commit atau deploy. Pemeriksa sintaks hanya mem-parse format yang didukung tanpa menjalankan skrip.

- Toolbox AI membantu menyiapkan tipe permintaan untuk membuat/mengedit/merapikan kode, evaluasi, eksekusi terisolasi, dan deploy. Saat ini AI/provider dan backend belum terhubung; permintaan hanya disimpan lokal, tidak dikirim dan tidak dijalankan.

- Tidak mengeksekusi kode repo. Snapshot hanya menyimpan path dan metadata Git (SHA, mode, ukuran bila tersedia); isi blob tidak diunduh. Path yang menyerupai secret, credential, token, password, key, env, backup, atau dump disaring. Nama/path repo privat tampil publik atas permintaan pemilik.

- GitHub Pages hanya menyajikan aset statis; backend PHP/Python, shell, Terraform, database dan binary harus dijalankan pada runtime asal yang sesuai. File Manager tidak menyediakan sandbox eksekusi atau akses tulis ke GitHub.

## Sinkronisasi data

Snapshot metadata berada di `data/repositories.json`; pohon direktori per repo disimpan sebagai `data/trees/<id>/index.json` dan shard gzip per folder, maksimal 500 item per halaman. Workflow `.github/workflows/sync-dashboard.yml` dirancang berjalan setiap hari pukul 04:17 UTC atau secara manual. Untuk memperbarui repo privat, tambahkan secret Actions bernama `PLANETBINTANG_READ_TOKEN` pada repo ini. Gunakan token read-only yang dapat membaca metadata/tree serta trafik untuk repo dalam scope; fallback Git hanya memakai `--filter=blob:none --no-checkout`. Token tidak masuk ke frontend. Tanpa secret itu workflow berhenti aman dan mempertahankan snapshot saat ini. Snapshot Hub di browser hanya memuat ulang file snapshot Pages; snapshot baru dibuat oleh workflow tersebut.

Rincian publikasi dan privasi: [DASHBOARD-DATA.md](./DASHBOARD-DATA.md).

## Shell lama

Shell mobile sebelumnya dipertahankan pada [mobile.html](./mobile.html). API filesystem lama memerlukan server Python lokal; API tersebut tidak dijalankan oleh GitHub Pages.

Untuk preview statis dashboard lokal:

```bash
python3 -m http.server 4173
```

Lalu buka `http://localhost:4173/`. Untuk menjalankan API shell lama, ikuti petunjuk server yang ada pada proyek dan gunakan runtime yang sesuai.

## Root Shell dan fitur sistem

Tombol **Shell** pada header menyediakan konsol perintah browser allowlist baca-saja: `help`, `status`, `list`, `search <teks>`, `open <nama-repo>`, `hosts`, serta ringkasan repo, Pages, DNS, trafik dan root map. File Manager menampilkan pohon lengkap sesuai status setiap repo; folder besar diminta secara bertahap.

Shell publik ini hanya melakukan operasi baca-saja pada snapshot dan navigasi ke host yang sudah terdaftar. Ia sengaja tidak mempunyai `eval`, akses shell OS, write, atau kemampuan menjalankan skrip arbitrer/kode repo. Eksekusi proses sungguhan membutuhkan backend terautentikasi dan runtime terisolasi; GitHub Pages tidak menyediakan fungsi itu.

Tema utama dashboard menggunakan putih dengan aksen biru. Logo yang sama menjadi ikon workspace dan tombol masuk sistem.
