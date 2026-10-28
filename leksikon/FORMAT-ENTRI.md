# Format entri leksikon

Folder kamus utama: `/leksikon/`. Setiap lema menggunakan satu folder slug bahasa Indonesia yang aman untuk URL, misalnya `/leksikon/kata/rumah/`. Simpan ejaan asli di data, jangan mengandalkan slug untuk mempertahankan kapitalisasi atau tanda diakritik.

## Bidang data yang didukung

- `lemma`: kata/lema sebagaimana ditulis.
- `slug`: nama folder URL satu kata, huruf kecil dan tanda hubung bila diperlukan.
- `definition`: definisi yang bersumber; kosong jika belum diverifikasi.
- `paragraph`: uraian penggunaan atau konteks.
- `partOfSpeech`: kelas kata (nomina, verba, adjektiva, adverbia, dan lain-lain).
- `examples`: contoh pemakaian yang bersumber atau ditulis sendiri.
- `etymology`, `variants`, `synonyms`, `antonyms`, `relatedTerms`.
- `utf8Binary`: representasi byte UTF-8 dari ejaan lema, bukan kode instruksi CPU.
- `icConcept`: pemetaan konseptual ke blok antarmuka/IC (masukan → normalisasi → indeks → panel). Ini dokumentasi alur data, bukan simulasi rangkaian listrik.
- `logoSymbol`: simbol/ikon yang menjelaskan kategori lema.
- `source`, `sourceUrl`, `license`, `reviewStatus`, `updatedAt`.

## Target korpus

Target proyek adalah 250.000+ lema. Angka ini adalah target, bukan klaim bahwa semua lema sudah tersedia. Jangan mengisi definisi KBBI dengan teks rekaan atau menyalin basis data berlisensi tanpa hak penggunaan. Impor hanya dari korpus yang pengguna berhak gunakan; lema tanpa definisi terverifikasi harus ditandai sebagai belum diverifikasi.

## Bentuk sumber impor

JSONL, satu objek JSON per baris. Minimal: `{"lemma":"rumah","definition":"...","partOfSpeech":"nomina","source":"...","license":"..."}`.

Generator situs dapat membentuk folder satu lema per entri saat proses pembangunan, tanpa menyimpan ratusan ribu berkas hasil turunan di Git. Data sumber dan hasil pembangunan harus tetap dapat ditelusuri.
