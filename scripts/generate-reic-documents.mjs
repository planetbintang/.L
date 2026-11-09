#!/usr/bin/env node
/**
 * Pembuat 1.500 dokumen otomasi kompilasi REIC berbahasa Indonesia.
 * Menulis berkas Markdown bernomor secara deterministik.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = "vmdesktopreic/dokumentasi-kompilasi";
const JUMLAH = 1500;
const KATEGORI = [
  "Persiapan Proyek", "Pembacaan Manifest", "Validasi Sintaks REIC", "Pemetaan Komponen",
  "Resolusi Dependensi", "Pemuatan REICSS", "Pemeriksaan Gaya", "Pemuatan REICJS",
  "Analisis Modul", "Pemeriksaan Impor Ekspor", "Penyusunan Grafik Modul", "Transformasi Sumber",
  "Kompilasi Aset", "Penggabungan Aset", "Optimasi Keluaran", "Pemeriksaan Aksesibilitas",
  "Validasi Antarmuka", "Pengujian Unit", "Pengujian Integrasi", "Pengujian Regresi",
  "Pemeriksaan Keamanan", "Pemeriksaan Kinerja", "Pembuatan Paket", "Pembuatan Indeks",
  "Pembuatan Peta Sumber", "Pemeriksaan Konsistensi", "Publikasi Statis", "Verifikasi Hasil",
  "Pemulihan Kegagalan", "Pelaporan dan Audit"
];
const AKSI = [
  "menyiapkan lingkungan kompilasi", "membaca konfigurasi proyek", "memeriksa struktur berkas",
  "memvalidasi deklarasi komponen", "mengidentifikasi dependensi", "menata urutan pemuatan",
  "memeriksa aturan tampilan", "memvalidasi modul perilaku", "menyelesaikan jalur impor",
  "menghasilkan artefak sementara", "menguji hasil transformasi", "mencatat status proses",
  "menyusun keluaran produksi", "memeriksa integritas paket", "menyiapkan laporan hasil"
];
const TAHAP = [
  ["Identifikasi", "Temukan berkas sumber dan catat jalur relatifnya."],
  ["Pemeriksaan", "Periksa keberadaan, ukuran, encoding UTF-8, dan keterbacaan sumber."],
  ["Validasi", "Jalankan pemeriksaan sintaks serta aturan struktur sebelum transformasi."],
  ["Resolusi", "Pastikan seluruh dependensi lokal tersedia dan tidak membentuk siklus yang dilarang."],
  ["Transformasi", "Proses sumber sesuai jenis berkas dan konfigurasi REIC."],
  ["Verifikasi", "Bandingkan keluaran dengan kontrak masukan dan aturan mutu."],
  ["Pencatatan", "Simpan ringkasan, waktu proses, status, dan pesan kegagalan yang aman."]
];
const slug = (s) => s.toLowerCase().normalize("NFKD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
function dokumen(n) {
  const kategori = KATEGORI[Math.floor((n - 1) / 50)];
  const aksi = AKSI[(n - 1) % AKSI.length];
  const tahap = TAHAP[(n - 1) % TAHAP.length];
  const nomor = String(n).padStart(4, "0");
  const judul = `Otomatisasi REIC ${nomor}: ${kategori} — ${aksi}`;
  const tujuan = `Mengotomatisasi kegiatan ${aksi} pada tahap ${kategori.toLowerCase()} agar proses kompilasi REIC konsisten, dapat diuji, dan dapat diaudit.`;
  return `---
id: REIC-DOC-${nomor}
judul: "${judul}"
kategori: "${kategori}"
bahasa: "Bahasa Indonesia"
standar: "REIC"
versi: "1.0"
jenis: "prosedur-otomatisasi-kompilasi"
---

# ${judul}

## 1. Tujuan
${tujuan}

## 2. Cakupan dan standar
Dokumen ini menjadi prosedur otomatisasi untuk proyek REIC. Pipeline mengenali:
- `.REIC`: manifest atau markup komponen sesuai format yang dinyatakan proyek.
- `.REICSS`: lembar gaya yang divalidasi sebagai CSS.
- `.REICJS`: modul JavaScript yang diperiksa sintaks dan dependensinya.
- `.HTML`, `.CSS`, dan `.JS`: aset web standar yang dapat diproses langsung.
- `.TS`, `.TSX`, `.JSX`, dan bahasa lain: wajib melewati alat transformasi/build yang sesuai sebelum dijalankan di peramban.
- `.PHP`: memerlukan runtime sisi server; tidak dieksekusi oleh GitHub Pages statis.

Jangan menganggap ekstensi sebagai bukti bahwa berkas sudah valid. Format aktual harus cocok dengan deklarasi manifest dan konfigurasi proyek.

## 3. Masukan
- Manifest utama REIC dan konfigurasi kompilasi yang berlaku.
- Berkas sumber `.REIC`, `.REICSS`, dan `.REICJS` beserta aset pendukung.
- Daftar dependensi, jalur impor, serta aturan keluaran.
- Versi runtime dan alat build yang dikunci dalam konfigurasi proyek.

## 4. Prasyarat
1. Repositori berada pada kondisi kerja yang diketahui dan perubahan sumber telah disimpan.
2. Direktori sumber serta direktori keluaran ditetapkan secara eksplisit.
3. Alat validasi tersedia dan versinya tercatat.
4. Proses berjalan dengan hak akses minimum; rahasia tidak ditulis ke log.
5. Berkas keluaran sementara tidak menimpa sumber.

## 5. Alur otomatisasi
1. **Temukan sumber:** pindai direktori yang diizinkan dan buat daftar berkas berdasarkan manifest.
2. **Klasifikasikan:** kelompokkan sumber menurut ekstensi dan deklarasi format.
3. **Periksa integritas:** pastikan berkas dapat dibaca, tidak kosong tanpa alasan, dan tidak berada di luar akar proyek.
4. **Validasi struktur:** periksa JSON/markup manifest, CSS, dan sintaks modul JavaScript menggunakan pemeriksa yang sesuai.
5. **Resolusi dependensi:** pastikan jalur impor lokal valid, hindari traversal direktori, dan deteksi dependensi melingkar.
6. **Proses kompilasi:** transformasikan hanya jenis berkas yang memerlukan transformasi; jangan menjalankan kode sumber yang tidak dipercaya.
7. **Susun keluaran:** tempatkan artefak pada direktori build terpisah dengan nama yang deterministik.
8. **Verifikasi keluaran:** periksa referensi aset, ukuran, checksum, dan konsistensi manifest keluaran.
9. **Catat hasil:** hasilkan ringkasan sukses/gagal tanpa membocorkan token, kunci, atau data pribadi.

## 6. Logika otomatisasi
```text
MULAI
  baca konfigurasi dan manifest REIC
  jika konfigurasi tidak valid: hentikan dengan status gagal
  temukan sumber yang diizinkan
  untuk setiap sumber:
    klasifikasikan berdasarkan format
    validasi struktur dan sintaks
    jika validasi gagal: catat lokasi dan hentikan tahap terkait
    selesaikan dependensi lokal
    jalankan transformasi yang diwajibkan format
    verifikasi artefak sementara
  susun paket keluaran
  jalankan pemeriksaan akhir
  tulis laporan dan checksum
SELESAI
```

## 7. Rincian tugas dokumen ini
**Tahap fokus:** ${tahap[0]}.

${tahap[1]}

**Tindakan khusus:** ${aksi}. Gunakan daftar sumber dari manifest, catat setiap berkas yang diproses, dan jangan mengubah sumber asli selama tahap ini.

## 8. Validasi dan kriteria keberhasilan
- Semua sumber yang diwajibkan ditemukan atau diberi alasan pengecualian.
- Tidak ada kesalahan sintaks yang belum ditangani.
- Dependensi lokal dapat diselesaikan dan tidak keluar dari akar proyek.
- Artefak dibangun pada direktori keluaran yang terpisah.
- Manifest keluaran merujuk pada aset yang benar-benar tersedia.
- Proses menghasilkan kode keluar yang tepat dan laporan yang dapat ditinjau.

## 9. Penanganan kegagalan
Jika pemeriksaan gagal, hentikan tahap yang bergantung pada hasil tersebut, simpan log yang sudah disanitasi, dan laporkan nama berkas serta nomor tahap. Jangan menerbitkan artefak parsial sebagai rilis. Setelah sumber diperbaiki, jalankan ulang dari tahap validasi atau dari awal bila dependensi berubah.

## 10. Keamanan dan perlindungan data
Batasi akses sistem berkas ke direktori proyek, hindari menjalankan perintah dari masukan pengguna, kunci versi dependensi, dan jangan menyimpan kredensial di dokumen atau keluaran. Tinjau perubahan sebelum publikasi.

## 11. Daftar uji
- [ ] Konfigurasi dan manifest dapat dibaca.
- [ ] Jenis berkas sesuai deklarasi.
- [ ] Sintaks dan dependensi tervalidasi.
- [ ] Proses transformasi selesai tanpa kesalahan.
- [ ] Keluaran dan checksum terverifikasi.
- [ ] Laporan otomatisasi tersimpan.

## 12. Keluaran
Artefak kompilasi pada direktori build, manifest keluaran, catatan validasi, dan laporan proses untuk tahap ${kategori.toLowerCase()}.

## 13. Status
Dokumen ini adalah spesifikasi prosedur otomatisasi. Implementasi aktual dijalankan oleh pipeline kompilasi proyek; keberhasilan hanya dinyatakan setelah seluruh pemeriksaan pada pipeline selesai.
`;
}
await mkdir(ROOT, { recursive: true });
for (let n = 1; n <= JUMLAH; n++) {
  const kategori = KATEGORI[Math.floor((n - 1) / 50)];
  const folder = join(ROOT, `${String(Math.floor((n - 1) / 50) + 1).padStart(2, "0")}-${slug(kategori)}`);
  await mkdir(folder, { recursive: true });
  const nomor = String(n).padStart(4, "0");
  await writeFile(join(folder, `REIC-${nomor}.md`), dokumen(n), "utf8");
}
const daftar = [
  "# Indeks 1.500 Dokumen Otomatisasi Kompilasi REIC", "",
  "Koleksi ini dibuat otomatis dalam Bahasa Indonesia. Setiap dokumen memiliki judul, tujuan, masukan, prasyarat, alur otomatisasi, validasi, penanganan kegagalan, keamanan, daftar uji, dan keluaran.", "",
  "- Jumlah dokumen: **1.500**",
  "- Kategori: **30**",
  "- Dokumen per kategori: **50**",
  "- Format: **Markdown (.md)**",
  "- Standar: **REIC 1.0**", "",
  "## Kategori", ...KATEGORI.map((k, i) => `${i + 1}. ${k} — ` + `[${String(i * 50 + 1).padStart(4, "0")}–${String((i + 1) * 50).padStart(4, "0")}]`), "",
  "## Prinsip kompilasi", "REIC, REICSS, dan REICJS divalidasi sesuai formatnya. TypeScript/JSX memerlukan proses build; PHP memerlukan runtime server dan tidak berjalan pada GitHub Pages statis.", ""
].join("\n");
await writeFile(join(ROOT, "README.md"), daftar, "utf8");
console.log(`Berhasil menghasilkan ${JUMLAH} dokumen Markdown pada ${ROOT}`);
