# Standar Bahasa dan Runtime PlanetBintang REIC

Versi standar: 1.0.0  
Target penerapan awal: VMDESKTOPREIC pada branch `io`.

## Tujuan

Ekstensi REIC menjadi format sumber resmi PlanetBintang dengan struktur dokumen, gaya, modul, impor/ekspor, dan konfigurasi yang konsisten. Ekstensi khusus bukan alias otomatis untuk bahasa lain: browser tidak menjalankan PHP, JSX, TypeScript, atau ekstensi MIME yang tidak dikenal tanpa toolchain/runtime.

## Pemetaan format

| Ekstensi | Peran | Padanan kemampuan |
|---|---|---|
| `.REIC` | Dokumen, komponen, template, dan manifest | HTML + struktur komponen |
| `.REICSS` | Gaya, tema, token desain, responsif | CSS |
| `.REICJS` | Logika, fungsi, event, modul, API browser | JavaScript ES module |
| `.TS/.TSX` | Sumber bertipe dan JSX bertipe | Dikompilasi saat build ke JavaScript |
| `.PHP` | Logika server, sesi, database, autentikasi | Dilayani backend PHP/API; bukan dieksekusi di GitHub Pages |

## 1. Struktur dokumen .REIC

Dokumen visual menggunakan markup HTML yang valid dengan root `<reic-app>`. Gunakan elemen HTML semantik, atribut aksesibilitas, dan atribut data untuk menghubungkan perilaku.

```html
<reic-app id="contoh-aplikasi" lang="id">
  <reic-config theme="ocean-blue" version="1.0.0"></reic-config>
  <reic-view name="beranda">
    <header class="reic-header">
      <h1>PlanetBintang REIC</h1>
    </header>
    <main>
      <button type="button" data-action="sapa">Jalankan</button>
      <output id="hasil" aria-live="polite"></output>
    </main>
  </reic-view>
</reic-app>
```

File `.REIC` juga boleh berupa JSON ketika dipakai sebagai manifest/registri. Loader mengenali JSON sebagai manifest dan teks markup sebagai template. Template hanya boleh dipasang dari sumber tepercaya; opsi `trusted:true` memberi izin kepada pemanggil untuk memasang markup aktif dan harus dipakai secara sadar.

## 2. Struktur .REICSS

Sintaks mengikuti CSS standar: selector, cascade, custom properties, pseudo-class, media query, keyframes, grid, flexbox, dan variabel tema.

```css
:root {
  --reic-ocean-900: #031a3a;
  --reic-ocean-700: #07558a;
  --reic-ocean-400: #45c4ee;
  --reic-surface: #082b4b;
}
.reic-header {
  color: #effaff;
  background: linear-gradient(120deg, var(--reic-ocean-900), var(--reic-ocean-700));
}
@media (max-width: 700px) {
  .reic-header { padding: 12px; }
}
```

## 3. Struktur .REICJS

Sintaks mengikuti ECMAScript module. Mendukung `import`, `export`, fungsi, class, promise, async/await, event listener, fetch, dan Web APIs yang tersedia di browser.

```js
export const konfigurasi = { tema: 'ocean-blue' };

export function pasangAksi(root = document) {
  root.querySelector('[data-action="sapa"]')?.addEventListener('click', () => {
    const hasil = root.querySelector('#hasil');
    if (hasil) hasil.textContent = 'REIC aktif.';
  });
}
```

File yang dimuat sebagai modul harus menggunakan `export` untuk API yang ingin dipakai modul lain. File lama berbentuk IIFE tetap dapat berjalan.

## 4. Impor, ekspor, dan pemuatan

- `.REIC` menyimpan dokumen atau manifest.
- `.REICSS` dimuat melalui fetch lalu disisipkan sebagai elemen style.
- `.REICJS` dimuat sebagai JavaScript module.
- Impor relatif pada modul REICJS diubah menjadi URL absolut terhadap file sumber.
- Urutan stylesheet dan script ditetapkan melalui konfigurasi boot runtime.
- Hindari menyisipkan token rahasia, PAT, kredensial, atau kata sandi ke file frontend.

## 5. Konfigurasi runtime

Runtime menyediakan `window.REIC` dengan API:
- `REIC.version`
- `REIC.extensions`
- `REIC.capabilities`
- `REIC.loadStyle(url)`
- `REIC.loadScript(url)`
- `REIC.readDocument(url)`
- `REIC.mountDocument(source, target, { trusted })`
- `REIC.boot({ styles, scripts })`
- `REIC.ready` sebagai Promise kesiapan runtime.

## 6. Kompatibilitas PHP, JSX, TS, dan TSX

- HTML/CSS/JavaScript: dapat dipetakan langsung ke struktur REIC.
- JSX/TSX: perlu transpiler build-time (misalnya Babel atau esbuild) untuk mengubah JSX menjadi JavaScript yang dipahami browser.
- TypeScript: perlu compiler build-time untuk menghapus tipe dan menghasilkan JavaScript.
- PHP: memerlukan server PHP. GitHub Pages hanya hosting statis, sehingga operasi server dipanggil melalui endpoint backend/API; file PHP tidak dapat dieksekusi oleh browser.
- Sintaks TypeScript/JSX mentah tidak boleh diberi ekstensi .REICJS dan diharapkan berjalan langsung tanpa proses kompilasi.

## 7. Keamanan

- Jangan pernah menyimpan token GitHub atau rahasia di browser.
- Gunakan backend untuk operasi privat, database, sesi, dan autentikasi.
- Validasi dan batasi sumber template sebelum memakai `trusted:true`.
- Gunakan HTTPS, validasi input, dan kebijakan akses yang sesuai.
- Ekstensi file bukan batas keamanan; konten tetap harus diperlakukan sesuai asal dan hak aksesnya.

## Status penerapan

Runtime loader dan integrasi awal pada VMDESKTOPREIC disediakan melalui `reic-language.js`. Dukungan langsung mencakup markup/manifest REIC, CSS REICSS, dan JavaScript module REICJS. Kompilasi TypeScript/JSX/TSX dan eksekusi PHP server-side tetap memerlukan toolchain/backend terpisah dan tidak diklaim aktif hanya dengan standar ekstensi ini.
