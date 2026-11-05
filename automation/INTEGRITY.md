# Automation Integrity Standard

## Prinsip

1. **Tidak mengarang status** — `prepared-for-review` berarti tugas baru dicatat, bukan fitur selesai.
2. **Bukti sebelum klaim** — status `verified` hanya boleh diberikan setelah pemeriksaan implementasi dan tes yang relevan lulus.
3. **Jejak audit konsisten** — setiap request mempunyai satu `eventId` unik dan satu record request yang dapat ditelusuri.
4. **Least privilege** — pemeriksaan integritas hanya memerlukan `contents: read`; proses validasi tidak memperoleh token rahasia.
5. **Perubahan terisolasi** — pekerjaan besar dibuat pada branch/PR; jangan menimpa file tanpa membaca versi saat ini dan meninjau diff.
6. **Tidak ada eksekusi instruksi bebas** — ringkasan tugas adalah data, bukan perintah shell; jangan memakai `eval` atau menjalankan kode REIC yang belum ditinjau.

## Tahapan status

- `prepared-for-review`: instruksi dan file baru tercatat.
- `in-progress`: implementasi sedang dikerjakan dan belum terbukti selesai.
- `verified`: implementasi, pemeriksaan statis, dan tes yang relevan telah berhasil; sertakan bukti commit/run.
- `rejected`: tugas ditolak atau dibatalkan dengan alasan yang tercatat.

Status tidak boleh dinaikkan hanya karena workflow berakhir sukses. Workflow sukses hanya membuktikan langkah-langkah workflow tersebut berhasil.

## Gate otomatis

`.github/workflows/automation-integrity.yml` berjalan pada perubahan terkait, dapat dijalankan manual, dan melakukan pemeriksaan terjadwal harian. Gate memeriksa sintaks Node.js, format request, status yang diizinkan, keunikan ID, timestamp, path, dan hubungan request dengan audit log.

Jalankan lokal:

```sh
node --check scripts/run-system-automation.mjs
node --check scripts/validate-automation-integrity.mjs
node scripts/validate-automation-integrity.mjs
```

## Aturan operasional

- Jangan menaruh token, password, private key, atau data pribadi di repository.
- Jangan menghapus atau menulis ulang `changes.jsonl` untuk menyembunyikan kegagalan; koreksi harus menjadi event baru yang dapat ditelusuri.
- Kegagalan validasi harus menghentikan promosi/deployment, bukan dilewati.
- Periksa run gagal dan log job sebelum mencoba ulang. Jangan mengulang workflow yang gagal karena konfigurasi atau kode tanpa memperbaiki penyebabnya.
- Review perubahan dan hasil deployment secara terpisah. Build sukses bukan bukti seluruh fungsi aplikasi berjalan.
