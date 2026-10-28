# Katalog Lema Bahasa Indonesia di `/aktif/`

## Sasaran
Katalog memakai nama folder berbasis satu kata Bahasa Indonesia, dengan halaman entri yang menjelaskan identitas lema, jalur, representasi UTF-8, dan alur sistem. Entri leksikal harus berasal dari sumber yang dapat digunakan kembali secara sah.

## Menghasilkan katalog
Sediakan berkas UTF-8 berisi satu kata per baris. Jangan menyalin basis data KBBI atau definisinya tanpa izin/lisensi yang sesuai.

```bash
python3 scripts/bangun-katalog-lema.py --source data/lema-id.txt --output aktif/kamus-data --minimum 250000
```

Perintah di atas memvalidasi sekurangnya 250.000 lema unik dan membangun indeks JSON ber-shard. Untuk membuat satu folder `index.html` per lema:

```bash
python3 scripts/bangun-katalog-lema.py --source data/lema-id.txt --output aktif/kamus-data --minimum 250000 --pages
```

Mode halaman-per-lema menghasilkan banyak berkas dan dapat membuat repositori serta proses GitHub Pages sangat besar. Gunakan indeks ber-shard untuk katalog publik berskala besar; buat halaman fisik hanya bila diperlukan dan setelah mengukur ukuran serta waktu pembangunan.

## Keakuratan dan batasan
- Skrip tidak mengunduh atau menyertakan 250.000 kata secara otomatis. Sumber lema perlu disediakan dan jumlah uniknya divalidasi.
- Kata dari daftar umum, korpus, atau hasil pembentukan tidak boleh disebut lema resmi KBBI tanpa pemeriksaan sumber resmi.
- Definisi, kelas kata, contoh, dan etimologi tidak direkayasa. Halaman menyatakan dengan jelas bila data makna belum tersedia.
- Nama folder diturunkan dari kata; aksen dihapus untuk slug URL dan benturan nama ditangani dengan akhiran angka. Nama lema asli tetap disimpan di indeks.
- GitHub Pages hanya menyajikan berkas statis. Skrip dijalankan saat pembangunan, bukan di server Pages.
