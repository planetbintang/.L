# Struktur direktori /media/

```text
media/
├── index.html                    # Halaman awal katalog media
├── README.md                     # Panduan operasional media root
├── STRUKTUR.md                   # Dokumen struktur dan pemeliharaan ini
├── planetbintang-system.json     # Identitas kanonis dan rute sumber
├── brand/
│   └── IDENTITY.md               # Kebijakan logo dan identitas
└── repositories/
    ├── README.md                 # Dokumentasi katalog repositori
    └── index.json                # Snapshot metadata 47 repositori
```

## Sumber kebenaran

1. Isi kode dan riwayat Git berada di repositori sumber masing-masing.
2. `repositories/index.json` adalah manifest metadata agregat yang dibuat melalui koneksi GitHub.
3. `../data/repositories.json` dan `../data/repository-scope.json` adalah snapshot dashboard File Manager yang telah ada sebelumnya; keduanya belum otomatis diganti oleh manifest pusat.
4. `planetbintang-system.json` mencatat nama kanonis sistem, kebijakan identitas, dan jalur indeks.

## Aturan perubahan

- Jangan menghapus atau menimpa repositori sumber saat memperbarui indeks.
- Buat snapshot baru hanya dari daftar yang dapat diakses koneksi berizin; tulis waktu pengambilan yang benar.
- Jangan menaruh token, password, private key, isi file rahasia, atau data pribadi ke manifest.
- Perlakukan nama repo privat sebagai metadata sensitif dan jangan menerbitkan halaman ini secara publik tanpa review.
- Logo baru menunggu unggahan dan konfirmasi pemilik. Jangan membuat pengganti atau mengubah aset logo yang ada sebelum konfirmasi.
- Aktifkan ruleset/branch protection di GitHub untuk enforcement; dokumen atau frontend saja tidak dapat mencegah pemilik berizin mengubah file.

## Status dan batasan

File dokumentasi dan manifest adalah file Git nyata di `planetbintang/.L` pada branch `io`. Manifest ini mengindeks repositori dan tidak menyalin seluruh isi repositori. Tidak ada klaim bahwa semua blob telah dipindahkan, bahwa filesystem perangkat telah diakses, atau bahwa logo baru telah dipasang. GitHub Pages tetap merupakan hosting statis.
