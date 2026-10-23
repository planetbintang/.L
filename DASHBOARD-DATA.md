# Planetbintang Root System — Data & Sync

Dashboard publik berada di `https://planetbintang.github.io/.L/` (GitHub Pages dari branch `io`). Simbol `.` adalah alias root yang terlihat di UI; cakupan repo yang disinkronkan dibatasi pada `data/repository-scope.json` agar workflow tidak menyisir repo lain.

## Data yang diterbitkan

Snapshot memuat nama dan URL repositori, visibility, branch utama, SHA commit terakhir, bahasa utama, tipe aplikasi perkiraan, status/domain Pages, DNS A/AAAA publik untuk host terkait, serta nama item tingkat atas yang sudah difilter. Angka views/clones adalah agregat GitHub repository traffic untuk jendela sampai 14 hari; angka ini bukan analytics kunjungan website Pages. SHA-256 snapshot ditampilkan untuk pemeriksaan integritas.

Nama dan tautan repo privat akan terlihat publik sesuai permintaan pemilik. Dashboard tidak mengambil atau menerbitkan isi file, jalur yang terdeteksi sensitif, rahasia/kredensial, daftar anggota, nama/email/ID pengguna, alamat IP pengunjung, cookie, atau trafik individual. Peta filesystem hanya daftar tingkat atas yang difilter dan tidak mengeksekusi kode.

## Batas runtime

GitHub Pages hanya menyajikan HTML/CSS/JavaScript statis. Dashboard tidak menjalankan PHP, Python server, shell, Terraform, database, binary, atau backend dari repositori yang dipetakan. Tautan aplikasi hanya dibuka jika metadata mencantumkan URL HTTPS; selain itu pengguna diarahkan ke halaman GitHub repo.

## Sinkronisasi harian

Workflow `.github/workflows/sync-dashboard.yml` berjalan setiap hari pada 04:17 UTC dan dapat dijalankan manual. Agar workflow dapat membaca metadata repo privat dan endpoint trafik, pemilik perlu menambahkan secret Actions `PLANETBINTANG_READ_TOKEN` di pengaturan repo `.L`. Token harus read-only, pemiliknya harus memiliki akses ke seluruh 45 repo pada `data/repository-scope.json`, dan izinnya harus mengizinkan pembacaan metadata, contents tingkat atas, serta repository traffic. Workflow memakai `GITHUB_TOKEN` repo-scoped hanya untuk menulis snapshot baru ke branch `io`.

Jika secret belum ada, workflow berhenti aman tanpa mengubah snapshot. Token tidak pernah ditempatkan di HTML, JavaScript, manifest, atau hasil dashboard. Jangan memakai token dengan izin write pada repo sumber.

## Shell dashboard

Header dashboard menyediakan browser shell untuk tugas allowlist baca-saja (`status`, `list`, pencarian, buka repo, peta host, ringkasan, dan root-map). Input pengguna tidak dievaluasi sebagai JavaScript atau perintah OS. Ini sengaja dibatasi karena halaman publik tidak boleh mengeksekusi kode repo atau menyediakan remote shell.
