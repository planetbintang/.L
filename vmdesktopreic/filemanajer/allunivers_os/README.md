# Allunivers OS / Kata — Filemanajer Integration

Sumber skema: `planetbintang/aireber`, branch `io`.

Referensi sumber:
- `src/lib/virtual-fs.ts` — struktur root virtual, penelusuran folder, pagination, dan node kata dengan enam file.
- `src/lib/kata-data.ts` — kategori kata serta generator konten REBER.

## Integrasi File Manager

Kategori `ALLUNIVERS OS · KATA` tersedia di File Manager pada branch `io`. Engine browser berada di:
`vmdesktopreic/filemanajer/allunivers_os/kata/kata-engine.reicjs`

Engine menyediakan kategori angka, kata Inggris, kata Indonesia, huruf besar/kecil, simbol, dan komponen UI. Folder dibuka dengan pagination (50 node per halaman), bukan memuat seluruh daftar sekaligus. Setiap node menyediakan enam file:
- `index.ieje`
- `style.aeea`
- `fungsi.nz`
- `component.ck`
- `registry.regs`
- `activity.log`

Ketika folder dibuka, File Manager membangkitkan konten file dari metadata kata dan menyediakan unduhan per file. Konten dibuat on-demand; tidak disimpan sebagai jutaan file fisik di Git.

## Batas materialisasi

Integrasi ini adalah filesystem virtual yang dapat ditelusuri dan diekspor per file. Ia **tidak** membuat 1,45 juta direktori fisik atau 8,7 juta file di repositori GitHub. Materialisasi massal ke GitHub Pages akan membebani ukuran repositori, proses checkout, dan deployment. Jika diperlukan arsip fisik, jalankan generator batch terpisah dan simpan hasilnya sebagai artefak/arsip terkompresi, bukan sebagai jutaan path di repositori situs.

Sumber: https://github.com/planetbintang/aireber/tree/io/src/lib
