# Vendor Domain Dashboard

Dashboard statis berbahasa Indonesia untuk ekosistem vendor domain, diterbitkan dari repositori `planetbintang/.L` pada folder `vendordomain/`.

## URL situs

- GitHub Pages: https://planetbintang.github.io/.L/vendordomain/
- Source: https://github.com/planetbintang/.L/tree/io/vendordomain

## Isi dan navigasi

- Satu tautan utama **Ikhtisar** dan empat dropdown header: **Domain & DNS**, **Vendor & Ekstensi**, **Situs & Deployment**, dan **Sistem & Administrasi**.
- Sidebar berisi 20 blok modul.
- Katalog berisi tepat 500 entri: 20 modul × 25 fitur; seluruh katalog ditampilkan pada halaman katalog dan bisa dicari/filter.
- Panel detail untuk setiap fitur, ekspor katalog ke CSV, tema terang/gelap, navigasi responsif, serta studio teks-ke-HTML dengan pratinjau dan unduhan file.
- Studio teks-ke-situs menampilkan pratinjau saat tombol **Perbarui pratinjau** ditekan; tombol **Unduh HTML** menghasilkan file HTML statis.

## Berkas

- `index.html`: kerangka dashboard, header, empat dropdown, sidebar, katalog, studio penerbitan, dan dialog detail.
- `vendor.css`: tata letak responsif, blok fitur, tema gelap, navigasi seluler, dan fokus keyboard.
- `vendor.js`: data 500 fitur, pencarian/filter, panel detail, ekspor CSV, dan generator HTML.

## Batas integrasi

Katalog dan interaksi frontend adalah prototipe statis. Pendaftaran/transfer domain, perubahan DNS, penerbitan TLS, penagihan, dan deployment hosting yang sesungguhnya memerlukan backend serta API penyedia dengan kredensial yang aman. Jangan menyimpan token registrar, API secret, atau private key dalam JavaScript frontend. File HTML yang diunduh baru menjadi publik setelah diunggah ke hosting dan domain diarahkan dengan DNS/HTTPS yang benar.

GitHub Pages akan memperbarui situs setelah commit pada branch yang dikonfigurasi sebagai sumber Pages selesai diproses.
## Menu utama dan verifikasi

Satu menu utama pada header adalah **Vendor Domain** dengan empat dropdown: **Domain & DNS**, **Vendor & Ekstensi**, **Situs & Deployment**, dan **Sistem & Administrasi**. Sidebar dan blok fitur menampilkan 20 modul × 25 entri = 500 fitur. Panel detail, filter, pencarian, ekspor CSV, tema, navigasi seluler, serta pratinjau dan unduhan HTML berjalan sebagai fitur frontend statis.

Perubahan ini tidak menambahkan backend registrar, DNS, pembayaran, atau hosting. Operasi produksi tetap memerlukan server/API layanan yang terautentikasi. GitHub Pages menyajikan frontend statis; publikasi situs yang dibuat dari teks mengharuskan file HTML hasil unduhan diterapkan ke hosting.
