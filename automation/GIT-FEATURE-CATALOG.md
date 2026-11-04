# Otomatisasi CATALOG 1500 FITUR GIT

Workflow: `.github/workflows/git-feature-catalog-automation.yml`

## Cakupan
- Membaca dan memvalidasi seluruh 1.500 entri dari `data/git-feature-catalog.json`.
- Membuat antrean berdasarkan modul, rentang indeks, dan ukuran batch (maksimal 50 fitur).
- Menyimpan manifest dan batch JSON di `automation/git-catalog/runs/<queue-id>/`.
- Mencatat event antrean di `automation/records/changes.jsonl`.
- Memvalidasi bahwa seluruh fitur terpilih tercakup tepat satu kali dalam batch.

## Menjalankan
GitHub → Actions → **Git Feature Catalog Automation** → Run workflow pada branch `io`.
Kosongkan `module_id` untuk seluruh modul. Rentang default 1–1500 dan ukuran batch 50 menghasilkan 30 batch.

## Batas penting
Workflow ini membangun antrean kerja yang dapat diaudit; workflow ini **tidak mengklaim 1.500 fitur sudah terimplementasi**. Implementasi kode membutuhkan executor AI/engineer yang terautentikasi dan diberi akses terkontrol. Setiap fitur hanya boleh ditandai `implemented` setelah perubahan kode, tes, dan bukti verifikasi tersedia. Jangan menaruh token atau rahasia di katalog, prompt, atau log.
