# VMDESKTOPREIC — target 1.500.000 file

## Status verifikasi repositori (branch `io`)

Target rancangan: **500.000 modul × 3 file komponen = 1.500.000 file komponen REIC**.

### File komponen yang sudah tercatat

| Batch | Modul | File komponen | Status |
|---|---:|---:|---|
| 0001–0006 | 138 | 414 | Ada di repositori; progres awal tercatat |
| 0007 | 5.000 | 15.000 | Workflow validasi/commit berhasil pada batch awal |
| 0008 | 2.666 | 7.998 | Berhasil; 8.000 file fisik termasuk manifest dan catatan |
| 0009 | 33.333 | 99.999 | Berhasil; 100.000 file fisik termasuk manifest |
| 0010-01 | 33.333 | 99.999 | Direktori ada; validasi dan commit kelompok berhasil |
| 0010-02 | 33.333 | 99.999 | Direktori ada; validasi dan commit kelompok berhasil |
| 0010-03 sampai 0010-05 | — | — | Belum ada di branch; workflow batch 0010 gagal sebelum menyelesaikan semua kelompok |
| 0011 | 33.333 | 99.999 | Berhasil; 100.000 file fisik termasuk manifest |

**Jumlah komponen REIC yang dapat dihitung dari batch tercatat: 423.408 file** (141.136 modul).  
**Sisa menuju target 1.500.000 file komponen: 1.076.592 file** (358.864 modul).

Metadata batch menambah file manifest/catatan di luar hitungan komponen di atas. Angka tersebut bukan klaim bahwa target 1,5 juta telah tercapai.

### Pola nama file dan isi

Setiap modul batch besar memakai:
- `modules/NNNNNNN/index.reic` — markup struktur modul REIC.
- `modules/NNNNNNN/index.reicss` — aturan gaya CSS bertanda selektor modul.
- `modules/NNNNNNN/index.reicjs` — ekspor metadata modul dan fungsi `mount(root)`.

Sampel dari batch 0007, 0008, 0009, 0010-01, 0010-02, dan 0011 telah diperiksa. Ketiga ekstensi dan pola nama tersedia. Batch 0007–0011 memakai kerangka generik bernomor seperti `REIC MODULE 0007805`, bukan 500 ribu nama fitur unik. Konten batch tersebut masih berupa kerangka umum dan belum membuktikan implementasi fitur khusus untuk setiap modul.

### Batas verifikasi

- Workflow batch 0008, 0009, dan 0011 berakhir sukses dan menjalankan pemeriksaan jumlah serta keberadaan file.
- Workflow batch 0010 berakhir gagal setelah dua kelompok pertama tersedia di branch; tiga kelompok terakhir belum tersedia.
- Pemeriksaan sampel isi dan nama file bukan pemeriksaan byte-per-byte seluruh 423 ribu file.
- Belum ada bukti bahwa semua modul dimuat oleh runtime VMDESKTOPREIC atau lulus pengujian browser/integrasi.
- File `.reicjs` adalah JavaScript ESM; integrasi pemuat `.reic`/`.reicss`/`.reicjs` tetap perlu diuji di runtime.

## Generator

`generate.mjs` membuat batch terbatas, dengan batas saat ini 33.333 modul per eksekusi. Contoh:

```sh
node generate.mjs --start 241136 --count 1000 --out batch-next --write
```

Generator memakai `flag: wx` agar file yang sudah ada tidak tertimpa. Jalankan validasi dan pengujian integrasi sebelum menganggap modul aktif.
