# PlanetBintang Automation Backend

Workflow: `.github/workflows/automation-backend.yml`

## Tujuan

Menerima tugas dari katalog fitur atau instruksi umum, membuat request record, membuat file baru yang diberikan secara eksplisit, memvalidasi data, lalu menyimpan semuanya melalui GitHub Actions dan commit ke branch `io`.

## Menjalankan

1. Buka tab **Actions** pada repository `planetbintang/.L`.
2. Pilih **PlanetBintang Automation Backend** lalu **Run workflow** pada branch `io`.
3. Isi `change_summary`, opsional `feature_id`, dan opsional `files_json`.
4. Periksa ringkasan workflow dan commit yang dihasilkan.

Contoh `files_json`:

```json
[
  {
    "path": "docs/automation-example.md",
    "content": "# Contoh\nBerkas baru dari tugas automation.\n"
  }
]
```

## Artefak dan pencatatan

- `automation/requests/PB-<run-id>-<run-number>.json`: instruksi, fitur terkait, status, dan daftar file.
- `automation/records/changes.jsonl`: satu event audit per permintaan.
- File baru yang diserahkan melalui input `files_json`.

## Batas keselamatan

- Hanya membuat file baru; tidak menimpa file yang sudah ada.
- Maksimal 20 file, 64 KiB per file, 256 KiB total per tugas.
- Menolak path traversal, area workflow/record yang dilindungi, dan pola kredensial umum.
- Tidak menjalankan prompt sebagai shell, tidak memakai `eval`, dan tidak mengeksekusi REIC arbitrer.
- Tidak otomatis mengklaim fitur selesai. Status awal `prepared-for-review` sampai implementasi dan tes benar-benar diverifikasi.
- GitHub Actions hanya memproses prompt sebagai instruksi/data; pembuatan kode oleh model AI memerlukan runner/agent AI terautentikasi yang terpisah.

## Kontrak

Ikuti `REKONSTRUKSI-SISTEM.md` dan `SYSTEM-FILE-REGISTRY.md`. Jangan menyimpan token atau rahasia di file repository.
