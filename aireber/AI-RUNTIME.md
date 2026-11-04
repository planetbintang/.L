# AI Reber — Runtime & Backend

## Arsitektur

AI Reber memiliki dua jalur yang terpisah dan jujur terhadap status runtime:

1. **Mesin lokal (GitHub Pages):** tokenisasi, retrieval dokumen sistem dan kata AlluniverS_OS, ranking, perangkaian jawaban, referensi, prompt/workspace lokal, dan fallback chat.
2. **Model generatif (Netlify Function):** permintaan chat dikirim ke `/api/reber`, diteruskan dari server ke endpoint OpenAI-compatible. Kunci provider tidak pernah berada di browser atau repository.
3. **Penyimpanan:** riwayat chat dan file workspace tetap berada di penyimpanan lokal browser; gateway hanya menerima pesan percakapan terakhir yang dikirim UI.
4. **Fallback:** bila gateway tidak tersedia atau belum dikonfigurasi, Chat Reber kembali ke mesin lokal.

## Deploy backend

GitHub Pages hanya menyajikan berkas statis. Untuk model generatif, deploy folder `aireber/` sebagai **Base directory** di Netlify menggunakan `aireber/netlify.toml`.

Build settings:
- Build command: `npm run build`
- Publish directory: `dist/client`
- Functions directory: `netlify/functions`

Tambahkan environment variables melalui pengaturan situs Netlify (jangan commit nilainya):

| Variable | Wajib | Keterangan |
|---|---:|---|
| `OPENAI_API_KEY` | Ya | Secret API key provider OpenAI-compatible |
| `REBER_ACCESS_TOKEN` | Ya | Kode akses kuat untuk membatasi pemanggilan gateway |
| `OPENAI_BASE_URL` | Tidak | Default `https://api.openai.com/v1`; dapat diarahkan ke provider kompatibel |
| `OPENAI_MODEL` | Tidak | Default `gpt-4o-mini`; isi model yang tersedia pada akun/provider |

Setelah deploy, buka Chat Reber dan masukkan nilai `REBER_ACCESS_TOKEN` pada panel Koneksi Model AI. Kode akses hanya berada di memori tab dan tidak disimpan ke LocalStorage atau GitHub.

## Endpoint

- `GET /api/reber`: status gateway dan kebutuhan konfigurasi.
- `POST /api/reber`: menerima maksimal 20 pesan user/assistant, tiap pesan maksimal 8.000 karakter, timeout provider 45 detik, dan mengembalikan jawaban JSON.
- `OPTIONS /api/reber`: preflight dasar.

## Keamanan dan batasan operasional

- Jangan pernah menaruh `OPENAI_API_KEY` atau `REBER_ACCESS_TOKEN` di HTML, JavaScript publik, commit, atau log.
- Gunakan kode akses acak yang panjang; rotasi bila bocor. Untuk penggunaan multi-pengguna/produksi, tambahkan autentikasi per pengguna, rate limiting persisten, kuota, monitoring biaya, dan proteksi penyalahgunaan pada gateway/edge.
- Fungsi ini tidak menjalankan kode yang dihasilkan AI dan tidak memberikan akses langsung ke File System perangkat.
- Fitur web research, gambar/audio/video generation, sinkronisasi cloud, dan operasi GitHub memerlukan layanan/tool terpisah dengan izin eksplisit.
- Gateway generatif memerlukan koneksi internet dan kredensial provider; biaya serta batas penggunaan mengikuti provider. Mesin lokal tetap berjalan tanpa provider.
- Netlify deployment dan panggilan model belum dapat diuji dari commit GitHub saja; lakukan deploy, isi environment variables, lalu uji endpoint dari situs Netlify.

## Smoke test

1. Buka `GET /api/reber`; status awal harus menyebut konfigurasi belum lengkap sampai kedua secret tersedia.
2. Masukkan kode akses yang sama dengan `REBER_ACCESS_TOKEN` pada panel Chat Reber.
3. Kirim pertanyaan sederhana; jawaban generatif harus tampil dan metadata menunjukkan model backend.
4. Uji kode akses salah; gateway harus mengembalikan 401.
5. Nonaktifkan gateway atau buka GitHub Pages; mesin lokal harus tetap dapat menjawab.
