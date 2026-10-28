# Korpus untuk pembangunan 250.000+ folder

Workflow `.github/workflows/bangun-leksikon.yml` membuat hingga 250.000 halaman folder sebagai artefak GitHub Actions ketika `leksikon/data/lema.jsonl` tersedia.

## Format

Buat `leksikon/data/lema.jsonl`, satu objek JSON per baris, dengan minimal bidang `lemma`. Bidang opsional meliputi `definition`, `paragraph`, `partOfSpeech`, `examples`, `etymology`, `variants`, `synonyms`, `antonyms`, `relatedTerms`, `source`, `sourceUrl`, `license`, dan `reviewStatus`.

Contoh:

```json
{"lemma":"rumah","definition":"...","partOfSpeech":"nomina","source":"Korpus berizin X","license":"CC BY 4.0","reviewStatus":"terverifikasi"}
```

## Pengamanan mutu dan hak pakai

- Workflow mensyaratkan setidaknya 250.000 lema unik dan berhenti jika korpus kurang dari jumlah tersebut.
- Jangan mengisi target dengan kata acak, kata tiruan, atau definisi yang dikarang seolah-olah berasal dari KBBI.
- Pastikan sumber mengizinkan penggunaan ulang dan distribusi. Jika definisi belum diverifikasi, biarkan kosong dan gunakan status `belum-diverifikasi`.
- Hasil saat ini dihasilkan sebagai artefak build, bukan 250.000 berkas yang dikomit satu per satu ke Git; cara ini menghindari pembengkakan riwayat repositori.

Sampai korpus berizin dengan 250.000 lema unik disediakan, workflow tidak dapat menghasilkan 250.000 entri nyata dan terverifikasi secara jujur.
