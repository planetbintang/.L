# Planetbintang Root System

Dashboard publik utama untuk workspace repositori Planetbintang: **https://planetbintang.github.io/.L/**. Ikon brand yang diberikan pemilik dipakai sebagai ikon PWA dan tombol masuk visual ke indeks sistem. Alias root yang ditampilkan adalah `.` → `planetbintang/`.

## Dashboard utama

- Mengindeks daftar 45 repo yang dipilih di `data/repository-scope.json`, dengan nama dan tautan repo privat ditampilkan publik sesuai instruksi pemilik.
- Menyediakan pencarian dan filter visibilitas/jenis aplikasi.
- Memetakan branch, SHA commit, status Pages/domain, host dan DNS IP publik, tipe aplikasi, serta item filesystem tingkat atas yang difilter.
- Menampilkan trafik repo agregat GitHub untuk jendela hingga 14 hari jika tersedia; bukan analytics pengunjung situs.
- Panel Pengaturan menampilkan alias root, status sumber GitHub, status snapshot, opsi tema lokal, dan kebijakan privasi.
- Tidak mengeksekusi kode repo. GitHub Pages hanya menyajikan aset statis; backend PHP/Python, shell, Terraform, database dan binary harus dijalankan pada runtime asal yang sesuai.

## Sinkronisasi data

Snapshot awal berada di `data/repositories.json`. Workflow `.github/workflows/sync-dashboard.yml` dirancang berjalan setiap hari pukul 04:17 UTC atau secara manual. Untuk memperbarui data repo privat, tambahkan secret Actions bernama `PLANETBINTANG_READ_TOKEN` pada repo ini. Gunakan token read-only yang dapat membaca metadata, daftar isi tingkat atas, dan trafik untuk repo dalam scope; token tidak masuk ke frontend. Tanpa secret itu workflow berhenti aman dan mempertahankan snapshot saat ini.

Rincian publikasi dan privasi: [DASHBOARD-DATA.md](./DASHBOARD-DATA.md).

## Shell lama

Shell mobile sebelumnya dipertahankan pada [mobile.html](./mobile.html). API filesystem lama memerlukan server Python lokal; API tersebut tidak dijalankan oleh GitHub Pages.

Untuk preview statis dashboard lokal:

```bash
python3 -m http.server 4173
```

Lalu buka `http://localhost:4173/`. Untuk menjalankan API shell lama, ikuti petunjuk server yang ada pada proyek dan gunakan runtime yang sesuai.
