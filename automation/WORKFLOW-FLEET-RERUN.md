# Workflow Fleet Rerun — PlanetBintang

Workflow: `.github/workflows/rerun-workflow-fleet.yml`

## Tujuan
Menginventarisasi run GitHub Actions historis pada branch target dan, setelah konfirmasi eksplisit, meminta GitHub menjalankan ulang run terpilih. Ini mengulang **workflow runs historis**, bukan membuat 2.500 definisi workflow baru.

## Prosedur
1. Buka tab **Actions** pada repositori `planetbintang/.L`.
2. Pilih **PlanetBintang Workflow Fleet Rerun**.
3. Jalankan pertama kali dengan `branch=io`, `mode=dry-run`, `max_runs=2500`, `include_success=false`.
4. Unduh dan tinjau artefak inventaris. Pastikan tidak ada workflow eksperimental, migrasi, pembuatan repositori, atau proses yang menulis data eksternal yang tidak boleh diulang.
5. Untuk menjalankan ulang, jalankan kembali dengan `mode=execute`. Centang `confirm_execute`. Secara default hanya run yang gagal/dibatalkan/bermasalah yang dipilih; run sukses tidak diulang kecuali `include_success=true`.
6. Pantau URL run satu per satu dan verifikasi hasil akhirnya. Permintaan API diterima bukan bukti bahwa run telah selesai sukses.

## Pengaman
- Hanya branch yang dipilih; default `io`.
- Maksimum 2.500 run per satu eksekusi.
- Run yang sedang berjalan/queued dan run orchestrator saat ini dikecualikan.
- Dry-run adalah default; eksekusi memerlukan checkbox konfirmasi.
- Rerun dapat mengulangi side effects workflow lama. Periksa workflow berisiko sebelum mode execute.
- Workflow menggunakan `GITHUB_TOKEN` dengan `actions: write` dan `contents: read`; tidak memerlukan PAT atau secret baru.
- Inventaris JSON dan ringkasan disimpan sebagai artefak GitHub Actions selama 30 hari.

## Batasan
Satu eksekusi memindai maksimum 2.500 run terbaru pada branch. Jika ada lebih banyak, jalankan batch lanjutan setelah meninjau inventaris. Workflow run yang tidak berada pada branch target tidak disentuh. Workflow yang tidak pernah dijalankan tidak dapat di-"rerun"; ia harus dipicu melalui mekanisme dispatch tersendiri.
