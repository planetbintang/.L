# Standar Kode Fungsional REIC

VMDESKTOPREIC memiliki lebih dari setengah juta file generated di dalam katalog sistem. Standar kode REIC memprioritaskan perilaku yang dapat dijalankan dan divalidasi, bukan jumlah baris artifisial.

Target 1.000 baris berlaku sebagai target pengembangan untuk modul inti yang memang membutuhkan perluasan. Target tersebut **tidak** diterapkan dengan menambahkan baris kosong atau komentar filler ke setiap file. Generated source, manifest, data, adapter legacy yang dikompresi, dan asset tidak dipaksa mencapai target karena akan memperbesar repository tanpa menambah kemampuan runtime.

Pemeriksaan dilakukan secara read-only:

```bash
python3 scripts/check-reic-code-standard.py
python3 scripts/check-reic-code-standard.py --json > /tmp/reic-code-report.json
```

Pemeriksaan mencakup file kosong, sintaks JavaScript, jumlah file kode, pemisahan generated source, dan laporan file inti yang masih di bawah target. Mode `--strict` tersedia untuk pekerjaan refactor berikutnya, tetapi tidak digunakan sebagai alasan untuk melakukan padding massal.
