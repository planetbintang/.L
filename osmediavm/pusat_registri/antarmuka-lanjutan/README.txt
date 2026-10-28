ANTARMUKA LANJUTAN — OS MEDIA VM
================================

Tujuan:
- Menggunakan daftar 1.500 modal dari ../daftar-menu.json.
- Menyediakan katalog 25.000 definisi antarmuka: menu, tombol, layout, posisi, ukuran, dialog, panel, toolbar, navigasi, kartu, kontrol, jendela, ikon, formulir, tab, notifikasi, dan aksesibilitas.
- Menampilkan pratinjau definisi dan membuat file teks .txt ketika pengguna memilih Unduh.
- Nama file yang diunduh berasal dari nama menu/komponen, dengan ekstensi .txt.

Berkas antarmuka:
- index.html — halaman katalog, pencarian, filter, pratinjau, dan pembuat unduhan TXT.
- Sumber data modal: ../daftar-menu.json.

Catatan implementasi:
25.000 definisi dibangkitkan secara deterministik saat halaman berjalan; 25.000 file tidak disimpan satu per satu dalam Git. Ini menjaga repositori dan deployment GitHub Pages tetap lebih ringan. Berkas .txt dibuat di browser ketika diminta oleh pengguna. Kontrol UI adalah konfigurasi antarmuka web; perubahan ke perangkat keras atau pengaturan OS host memerlukan runtime berizin terpisah.
