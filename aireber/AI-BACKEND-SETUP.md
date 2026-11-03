# AI Reber — backend AI opsional

AI Reber tetap memakai `aireber/reber-chat-engine.js` sebagai inti lokal (retrieval, perangkaian, referensi lokal, dan perintah File Manager). Penambahan backend ini memungkinkan percakapan memakai model melalui OpenAI Responses API; jika backend tidak disetel/gagal, UI memberi tahu lalu memakai mesin lokal.

## Deploy backend aman (Cloudflare Workers)

1. Buat Worker baru di akun Cloudflare.
2. Salin `aireber/api-worker.js` sebagai kode Worker.
3. Tambahkan secret Worker bernama `OPENAI_API_KEY` melalui pengaturan Secrets/Variables Cloudflare. Jangan menaruh key di HTML, JavaScript browser, GitHub, atau chat.
4. Set variable `ALLOWED_ORIGIN` ke origin situs, misalnya `https://planetbintang.github.io` (tanpa path). Ini membatasi permintaan lintas-origin.
5. Opsional: set `OPENAI_MODEL` ke model yang tersedia untuk project API Anda. Default kode adalah `gpt-6-astra`. Set `ENABLE_WEB_SEARCH=true` untuk mengaktifkan tool pencarian web API (dapat menambah biaya).
6. Deploy Worker dan salin URL HTTPS Worker.
7. Buka `aireber/reber-config.js` dan isi `apiEndpoint` dengan URL Worker, lalu commit/deploy situs.

## Catatan

- GitHub Pages hanya menyajikan file statis; ia tidak menjalankan endpoint rahasia/server. Karena itu backend harus di-host terpisah.
- Penggunaan OpenAI API dapat dikenai biaya sesuai pemakaian dan pengaturan project. Ini berbeda dari penggunaan ChatGPT berlangganan.
- Backend menggunakan `store: false` untuk tidak menyimpan respons di sisi Responses API. Riwayat lokal tetap berada di perangkat pengguna sesuai perilaku UI saat ini.
- Sebelum produksi, tambahkan autentikasi pengguna, rate limit, batas kuota, pemantauan biaya, dan kebijakan privasi. CORS saja bukan mekanisme autentikasi.
- Periksa model yang tersedia untuk project sebelum deploy. Jangan pernah mengirim API key dari browser.
