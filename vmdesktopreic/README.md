# VMDESKTOPREIC

Desktop PlanetBintang REIC dengan komposisi visual galaksi dan bumi, tanpa taskbar bawah.

## Runtime
- Setiap launcher kiri dan kanan membuka modul aplikasi dalam jendela tersendiri.
- Jendela aplikasi dapat dipindahkan, diminimalkan, dimaksimalkan, dan ditutup.
- Seluruh jendela aplikasi dibatasi oleh elemen `.desktop-stage`; overflow dipotong pada batas desktop.
- File Manager memiliki navigasi folder, pencarian, tampilan grid/list, dan tautan ke penjelajah repositori.
- REIC Explorer membaca daftar repositori publik PlanetBintang melalui GitHub REST API dan dapat membuka direktori serta file repositori publik.
- Monitor Sistem memeriksa status browser dan konektivitas GitHub API.
- Terminal REIC menyediakan perintah lokal read-only: `help`, `status`, `repos`, `open [aplikasi]`, dan `clear`.

## File runtime
- `index.html` — desktop dan struktur aplikasi.
- `reference-match.css` — komposisi visual, responsif, dan artwork kosmik.
- `runtime.reicss` — jendela aplikasi dan komponen runtime.
- `runtime.reicjs` — launcher, modal, File Manager, dan integrasi GitHub publik.
- `desktop-wallpaper.svg` — artwork antariksa dan bumi.
- `indexes/` dan `registry/` — sumber indeks dan registri REIC.

## Integrasi GitHub dan batas akses
GitHub Pages adalah hosting statis. Runtime ini menggunakan endpoint GitHub REST publik tanpa menyimpan token di browser. Repositori privat tidak dapat dibaca melalui endpoint publik. Untuk akses privat, commit, push, pembuatan branch, atau pengelolaan workflow dari desktop, hubungkan backend OAuth/GitHub App yang menyimpan kredensial di server; jangan menaruh PAT atau token rahasia dalam file JavaScript, HTML, atau localStorage.

## Indeks
Paket indeks REIC yang ada tetap menjadi sumber indeks sistem. Angka sublink virtual adalah ruang indeks terpaginasikan, bukan klaim bahwa jutaan file fisik sudah dibuat.
