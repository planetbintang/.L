# Planetbintang Root System — Data & Sync

Dashboard publik berada di `https://planetbintang.github.io/.L/` (GitHub Pages dari branch `io`). Simbol `.` adalah alias root yang terlihat di UI; cakupan repo yang disinkronkan dibatasi pada `data/repository-scope.json` agar workflow tidak menyisir repo lain.

## Data yang diterbitkan

Snapshot utama memuat nama/URL repo, visibility, branch, SHA commit, bahasa, tipe sistem, Pages/domain, DNS publik dan trafik agregat hingga 14 hari. File Manager menambahkan seluruh path yang dapat diindeks beserta tipe, mode, Git object SHA dan ukuran jika tersedia. Daftar path dipecah menjadi halaman gzip paling banyak 500 item, diambil hanya saat folder dibuka; manifest tiap repo mencatat cakupan dan SHA. File blob tidak diunduh. SHA-256 snapshot, manifest dan halaman shard dapat diperiksa.

Nama, tautan dan jalur repo privat terlihat publik sesuai permintaan pemilik. Jalur yang cocok dengan penanda secret/credential/token/password/private key/certificate/SSH/env/backup/dump disaring. Dashboard tidak mengambil atau menerbitkan isi file, rahasia/kredensial, daftar anggota, nama/email/ID pengguna, alamat IP pengunjung, cookie, atau trafik individual. Git tree fallback memakai partial clone `--filter=blob:none --no-checkout` dan memeriksa HEAD/tree SHA; tidak ada checkout atau eksekusi kode.

## Batas runtime

GitHub Pages hanya menyajikan HTML/CSS/JavaScript statis. Penilaian browser hanya metadata struktural: cakupan tree, object SHA/mode/ukuran, bahasa, file executable bit, commit terakhir dan kandidat entry point/manifest dari nama file. Itu bukan audit keamanan/kerentanan dan bukan bukti bahwa kode aman. Dashboard tidak menjalankan PHP, Python server, shell, Terraform, database, binary, atau backend repo. Tautan aplikasi hanya dibuka jika metadata mencantumkan URL HTTPS.

## Sinkronisasi harian

Workflow `.github/workflows/sync-dashboard.yml` berjalan setiap hari pada 04:17 UTC dan dapat dijalankan manual. Agar workflow dapat membaca metadata, Git tree repo privat dan endpoint trafik, pemilik perlu menambahkan secret Actions `PLANETBINTANG_READ_TOKEN`. Token harus read-only, memiliki akses ke seluruh 45 repo pada `data/repository-scope.json`, dan mengizinkan pembacaan metadata, contents/tree serta repository traffic. Token hanya digunakan di proses sinkronisasi; `GITHUB_TOKEN` repo-scoped dashboard digunakan untuk commit snapshot/shard ke branch `io`.

Jika secret belum ada, workflow berhenti aman tanpa mengubah snapshot. Token tidak pernah ditempatkan di HTML, JavaScript, manifest, atau hasil dashboard. Jangan memakai token dengan izin write pada repo sumber.

## Snapshot Hub dan navigasi

Menu header menampilkan satu view pada satu waktu sementara header tetap tersedia. Ikon brand membuka Snapshot Hub. Tombol muat ulang di hub mengambil ulang `data/repositories.json` yang telah diterbitkan, lalu mengirim objek snapshot yang sama ke Dashboard, Workspace, dan File Manager. Status hub hanya mengonfirmasi bahwa view browser telah menerima snapshot; ia tidak memulai GitHub Actions, bukan koneksi langsung ke 45 repo, dan tidak menyinkronkan localStorage antarperangkat.

Untuk membuat snapshot baru, gunakan alur GitHub Actions yang terautentikasi. Snapshot browser tetap mencakup metadata/tree saja: isi blob privat tidak dapat dibuka melalui Pages dan kode di repo tidak dijalankan. File publik dapat dipreview satu per satu di Code workspace sesuai batas ukuran yang didokumentasikan.

## Shell dashboard

Header dashboard menyediakan browser shell untuk tugas allowlist baca-saja (`status`, `list`, pencarian, buka repo, peta host, ringkasan, dan root-map). File Manager membuka path `/`, menelusuri hierarki folder, dan memuat halaman item secara bertahap. Input pengguna tidak dievaluasi sebagai JavaScript/perintah OS dan tidak ada kode repo yang dijalankan; ini sengaja dibatasi karena halaman publik tidak boleh menyediakan remote shell.

## Workspace browser

Menu Proyek/Kanban, Issues/diskusi, profil, preferensi, dan permintaan AI disimpan pada `localStorage` browser yang digunakan. Ini bukan GitHub Projects atau GitHub Issues dan tidak tersinkron antarpengguna/perangkat. Analitik hanya menghitung agregat snapshot repositori, struktur Git, serta trafik GitHub repo jika tersedia; bukan pemantauan pengunjung situs.

Code workspace hanya mengambil berkas publik dari `raw.githubusercontent.com` untuk preview hingga 1 MiB, lalu memungkinkan draft lokal dan unduh file draft. Tidak ada sumber repo privat yang diambil. Draft tidak ditulis ke GitHub dan pemeriksa sintaks lokal tidak menjalankan kode. Bila koneksi gagal, pengguna dapat membuka GitHub setelah autentikasi atau menempelkan isi secara manual; jangan simpan credential di halaman ini.

Toolbox AI saat ini hanya menyimpan prompt secara lokal. Provider AI dan backend situs belum terhubung. Fitur AI yang benar-benar membuat/mengubah kode, mengakses repo privat, mengeksekusi proses, atau deploy memerlukan layanan server privat dengan autentikasi, secret hanya di server, sandbox per proses dengan batas resource, tinjauan perubahan dan persetujuan deployment. GitHub Pages statis tidak menyediakan fungsi tersebut; jangan menaruh API token atau menambahkan remote shell ke JavaScript publik.
