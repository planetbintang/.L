# Harga dan Pembayaran REIC

Halaman publikasi katalog harga satuan dan metode pembayaran Indonesia/internasional.

- `index.reic`: kontrak komponen REIC.
- `pricing.json`: daftar produk, satuan, mata uang, dan metode pembayaran.
- `index.html`, `pricing.css`, `pricing.js`: halaman katalog statis.

**Harga:** seluruh nilai masih `null`/belum disahkan OWNER. Jangan mengganti menjadi tarif publik sebelum Owner menentukan nominal, pajak, siklus tagihan dan ketentuan refund.

**Pembayaran:** daftar metode adalah katalog opsi. Aktivasi memerlukan akun merchant/provider, kontrak, verifikasi bisnis, kredensial di server, checkout server-side, verifikasi signature webhook, idempotency, refund dan rekonsiliasi. Halaman statis ini tidak memproses uang atau menyimpan data kartu.
