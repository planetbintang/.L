# Allunivers OS / Kata — Filemanajer Integration

Kategori kata telah diperluas dengan daftar kata dasar bahasa Indonesia yang diambil dari daftar kosakata pada sumber proyek `planetbintang/aireber` (`src/lib/kata-data.ts`, branch `io`). Kata dasar ditampilkan sebagai nama folder, bukan sekadar label katalog.

## Kategori folder
- **JUTAAN FOLDER VIRTUAL**: 10.000.000 nama folder unik yang dibentuk secara deterministik dari kombinasi huruf, tanpa membuat jutaan direktori fisik.
- **KATA DASAR INDONESIA**: 579 nama folder kata dasar unik satu kata.
- **KATA TURUNAN INDONESIA · GENERATOR**: kombinasi imbuhan yang dibangkitkan saat dibuka. Ini adalah hasil generator, bukan klaim bahwa setiap kombinasi merupakan lema KBBI.
- **ANGKA**, **KATA BAHASA INGGRIS**, **HURUF**, **SIMBOL**, dan **KOMPONEN UI** tetap tersedia.

## Isi setiap folder kata
Setiap folder menyediakan enam berkas REBER yang dibuat on-demand:
- `index.ieje`
- `style.aeea`
- `fungsi.nz`
- `component.ck`
- `registry.regs`
- `activity.log`

Kategori JUTAAN FOLDER VIRTUAL menghasilkan nama seperti `kata-a`, `kata-b`, `kata-c`, dan seterusnya secara deterministik; jumlah tersedia 10.000.000 entri. Folder ditampilkan secara bertahap melalui pagination dan nama folder di-encode aman untuk jalur URL. Konten berkas dapat dihasilkan dan diunduh satu per satu.

## Catatan sumber dan penyimpanan
Daftar ini berasal dari kosakata proyek Aireber; bukan salinan atau pengesahan resmi KBBI. Folder dan berkas bersifat virtual/on-demand, bukan direktori fisik yang semuanya disimpan di GitHub. Untuk daftar KBBI resmi, sumber dan lisensi/ketentuan penggunaan Badan Bahasa perlu diverifikasi terpisah.

Sumber kosakata: https://github.com/planetbintang/aireber/blob/io/src/lib/kata-data.ts
