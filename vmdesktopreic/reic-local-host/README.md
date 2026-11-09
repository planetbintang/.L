# REIC Local Host, Penyimpanan, Domain, dan Integrasi Infrastruktur

## Sasaran
Menyediakan host lokal REIC pada `127.0.0.1:8787`, penyimpanan lokal yang dibatasi ke direktori data, serta adaptor untuk daftar repositori GitHub publik dan privat. Token GitHub hanya berada di lingkungan server.

## Menjalankan host lokal
1. Pasang Node.js 20 atau lebih baru.
2. Salin `.env.example` menjadi `.env` dan isi token fine-grained GitHub.
3. Berikan izin minimum: Metadata read-only dan Contents read-only untuk repositori yang dibutuhkan; pilih semua repositori yang memang harus diakses.
4. Jalankan dengan pemuatan variabel lingkungan: `node --env-file=.env server.mjs`.
5. Uji `http://127.0.0.1:8787/health`.
6. Buka VMDESKTOPREIC, aplikasi **Host Lokal REIC**, lalu masukkan alamat host tersebut.

Token tidak boleh ditaruh pada HTML, JavaScript frontend, konfigurasi publik, atau commit Git. Jangan gunakan token klasik dengan cakupan luas jika token fine-grained dapat dipakai.

## API
- `GET /health`: pemeriksaan kesehatan host.
- `GET /api/reic/storage?path=.`: daftar berkas pada akar penyimpanan.
- `GET /api/reic/github/repos`: repositori yang dapat dibaca token untuk pemilik `planetbintang`, termasuk status publik/privat.
- `GET /api/reic/github/tree?repo=.L&ref=io&path=vmdesktopreic`: isi direktori repositori.

Server lokal membatasi bind ke loopback, memvalidasi traversal jalur, hanya menerima GET, dan tidak menyediakan operasi tulis/hapus. Perluasan operasi tulis harus ditambahkan dengan autentikasi, audit, CSRF protection, dan validasi terpisah.

## Nginx dan Apache
Contoh reverse proxy tersedia di `host-adapters/nginx/reic.conf` dan `host-adapters/apache/.htaccess`. Konfigurasikan TLS pada virtual host produksi, bukan dengan membuka port Node ke internet secara langsung.

## Cloudflare
Cloudflare DNS/proxy dapat mengarahkan nama host ke origin yang dikelola. Template Worker menyediakan proxy GitHub terautentikasi; pasang `GITHUB_TOKEN`, `GITHUB_OWNER`, dan `ALLOWED_ORIGINS` sebagai secret/variable Worker. R2 cocok untuk objek, D1 untuk metadata/indeks; keduanya opsional dan belum dibuat otomatis oleh template.

## Verisign dan standar domain
Verisign berperan sebagai operator registry untuk TLD tertentu. Integrasi registry umumnya melalui registrar terakreditasi dengan protokol EPP dan ketentuan kontrak; tidak ada endpoint publik universal untuk mengelola semua domain. Template ini hanya menetapkan lapisan DNS/registry adapter dan standar RFC 1034/1035 serta DNSSEC RFC 4033–4035. Jangan mengklaim registrasi domain aktif sebelum kredensial registrar dan lingkungan uji tersedia.

## GlobalCert dan TLS
Profil GlobalCert dicatat sebagai penyedia sertifikat yang diminta. Otomatisasi hanya dapat diaktifkan bila layanan/produk yang digunakan menyediakan ACME atau API penerbitan yang terdokumentasi. Simpan private key di host, pantau masa berlaku, dan gunakan TLS 1.2 atau lebih baru. Tidak ada sertifikat yang diterbitkan oleh perubahan repositori ini.

## Batasan GitHub Pages
GitHub Pages adalah hosting statis. Ia tidak menjalankan Node.js, PHP, Nginx, atau Apache. Untuk daftar privat, desktop memanggil host lokal atau Worker yang dikonfigurasi pemilik. Tanpa backend terautentikasi, browser hanya dapat menampilkan repositori publik.

## Aktivasi komponen
Berkas sumber tidak otomatis dieksekusi hanya karena berada dalam folder. REIC hanya memuat komponen yang terdaftar dalam manifest dan lolos validasi. REICSS diperlakukan sebagai gaya; REICJS sebagai modul dengan izin eksplisit; HTML/MD/JSON ditampilkan sebagai konten. Skrip tak dikenal tidak dijalankan otomatis.
