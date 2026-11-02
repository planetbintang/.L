# Harga dan Pembayaran REIC

Halaman publikasi katalog harga satuan dan metode pembayaran Indonesia/internasional.

## Kebijakan harga

- Harga dasar seluruh kategori dimulai dari **Rp2.500.000** per satuan penagihan yang tercantum.
- Batas maksimum tidak ditetapkan (tanpa batas maksimum).
- Harga akhir dapat ditentukan, disesuaikan, atau diberikan sebagai penawaran khusus oleh **OWNER** berdasarkan spesifikasi, kapasitas, kompleksitas, biaya registrar/provider, pajak, SLA, dan kontrak.
- Nominal final, diskon, pajak, siklus tagihan, dan refund tetap memerlukan persetujuan OWNER sebelum menjadi harga transaksi.
- pricing.json menyimpan batas bawah, maksimum tak terbatas (null), dan kewenangan override OWNER.

## Komponen

- index.reic: kontrak komponen REIC.
- pricing.json: daftar produk, satuan, mata uang, dan metode pembayaran.
- index.html, pricing.css, pricing.js: halaman katalog statis.

## Pembayaran

Daftar metode adalah katalog opsi. Aktivasi memerlukan akun merchant/provider, kontrak, verifikasi bisnis, kredensial di server, checkout server-side, verifikasi signature webhook, idempotency, refund dan rekonsiliasi. Halaman statis ini tidak memproses uang atau menyimpan data kartu.
