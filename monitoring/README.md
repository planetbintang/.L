# Monitoring Sistem Planetbintang

Halaman `index.html` memeriksa keterjangkauan URL publik yang didefinisikan di `targets.json` menggunakan permintaan HTTP `HEAD`. Pemeriksaan dilakukan ketika halaman dibuka, setelah tombol **Periksa sekarang**, lalu tiap 60 detik selama tab browser terlihat. Jika server menolak `HEAD` dengan HTTP 405/501, skrip mencoba `GET` dengan header `Range`. Redirect tidak diikuti otomatis; respons redirect ditampilkan sebagai masalah untuk menjaga probe tetap pada root subpath Pages.

## Snapshot dan privasi

`build-public-monitor-status.py` membaca waktu `updatedAt` dari snapshot sumber saat pipeline Pages berjalan dan menulis `snapshot-status.json` dengan tiga field metadata waktu/skema saja. Artefak itu tidak memuat nama, URL, visibilitas, atau daftar repositori. Halaman monitor tidak menautkan katalog repositori mentah. Sumber snapshot tetap ada di repository; visibilitas data yang sudah ada di repository publik memerlukan tinjauan privasi tersendiri.

## Batas operasional

- Hasil menunjukkan respons HTTP untuk path yang diminta, bukan kesehatan runtime JavaScript, backend Node.js, database, DNS provider, akun, atau workflow GitHub Actions. Redirect tidak diselesaikan dan dihitung sebagai respons non-2xx.
- GitHub Pages tidak menjalankan worker monitoring di server. Polling berhenti saat tab tidak terlihat/ditutup; hasil dan latensi hanya berada di memori browser, tanpa histori terpusat atau alert.
- Status snapshot membandingkan timestamp sumber dengan waktu perangkat browser dan ambang 36 jam; ini bukan validasi bahwa data sumber GitHub masih mutakhir.
- Probe hanya membaca path relatif di dalam origin/subpath situs, tidak mengikuti redirect, dan tidak mengirim kredensial.

Jika dibutuhkan uptime monitoring 24/7, alert, histori, serta pemeriksaan backend dan database, integrasikan layanan monitor server-side terpisah dengan endpoint health publik yang minim informasi dan kredensial yang aman.
