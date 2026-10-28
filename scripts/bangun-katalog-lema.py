#!/usr/bin/env python3
"""Bangun katalog lema Indonesia dari daftar sumber yang sah.

Masukan: satu lema per baris UTF-8 (misalnya ekspor yang lisensinya mengizinkan
redistribusi). Skrip tidak mengarang lema KBBI dan tidak mengambil konten situs.
Secara default menghasilkan indeks JSON ber-shard; --pages membuat halaman
statis per lema jika memang diperlukan.
"""
from __future__ import annotations
import argparse, html, json, re, unicodedata
from pathlib import Path

def slugify(word: str) -> str:
    value = unicodedata.normalize("NFKD", word.lower())
    value = "".join(c for c in value if not unicodedata.combining(c))
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value or "lema"

def clean_words(source: Path) -> list[str]:
    seen, words = set(), []
    for line in source.read_text(encoding="utf-8-sig").splitlines():
        word = " ".join(line.strip().split())
        if not word or word.startswith("#"):
            continue
        key = word.casefold()
        if key not in seen:
            seen.add(key)
            words.append(word)
    return sorted(words, key=str.casefold)

def page(word: str, slug: str, number: int) -> str:
    w, s = html.escape(word), html.escape(slug)
    bits = " ".join(f"{b:08b}" for b in word.encode("utf-8"))
    return f"""<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Entri katalog kata Bahasa Indonesia: {w}."><title>{w} · Kamus Digital Planetbintang</title>
<style>body{{margin:0;background:#071522;color:#edf7ff;font:16px/1.7 system-ui;padding:clamp(16px,4vw,42px)}}main{{max-width:850px;margin:auto}}section{{padding:20px;border:1px solid #31536d;background:#0b2033}}a{{color:#6de1ff}}code,pre{{overflow-wrap:anywhere;white-space:pre-wrap}}.muted{{color:#b2c8db}}</style></head>
<body><main><p>🌐 PERPUSTAKAAN BAHASA INDONESIA · ENTRI {number:06d}</p><h1>{w}</h1>
<section><h2>Identitas lema</h2><p>Entri ini berasal dari berkas sumber kata yang disediakan untuk membangun katalog. Keberadaan dalam katalog tidak dengan sendirinya membuktikan bahwa kata ini merupakan lema resmi KBBI.</p>
<dl><dt>Nama lema</dt><dd>{w}</dd><dt>Alamat folder</dt><dd><code>/aktif/kamus/{s}/</code></dd><dt>Nomor entri</dt><dd>{number}</dd><dt>Panjang karakter</dt><dd>{len(word)}</dd></dl></section>
<section><h2>Representasi UTF-8</h2><pre>{html.escape(bits)}</pre><h2>Alur sistem</h2><p>Masukan kata → normalisasi → indeks leksikal → halaman entri → pencarian dan navigasi.</p><p class="muted">Makna, kelas kata, contoh, dan etimologi hanya ditampilkan apabila disediakan oleh sumber berizin dan terverifikasi.</p></section>
<p><a href="../index.html">Kembali ke katalog kata</a> · <a href="../../index.html">Halaman utama</a></p></main></body></html>"""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True, help="TXT UTF-8, satu lema per baris")
    ap.add_argument("--output", default="aktif/kamus-data", help="direktori keluaran")
    ap.add_argument("--pages", action="store_true", help="buat satu folder/halaman per lema")
    ap.add_argument("--minimum", type=int, default=1, help="gagal bila jumlah lema unik di bawah batas")
    ap.add_argument("--shard-size", type=int, default=5000)
    args = ap.parse_args()
    words = clean_words(Path(args.source))
    if len(words) < args.minimum:
        raise SystemExit(f"Gagal: hanya {len(words):,} lema unik; minimum {args.minimum:,}.")
    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)
    index = []
    used = {}
    for i, word in enumerate(words, 1):
        base = slugify(word)
        used[base] = used.get(base, 0) + 1
        slug = base if used[base] == 1 else f"{base}-{used[base]}"
        index.append({"id": i, "kata": word, "slug": slug, "path": f"/aktif/kamus/{slug}/"})
        if args.pages:
            folder = out.parent / "kamus" / slug
            folder.mkdir(parents=True, exist_ok=True)
            (folder / "index.html").write_text(page(word, slug, i), encoding="utf-8")
    for start in range(0, len(index), args.shard_size):
        shard = index[start:start + args.shard_size]
        (out / f"indeks-{start // args.shard_size + 1:04d}.json").write_text(
            json.dumps(shard, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    manifest = {
        "bahasa": "id", "jumlah_unik": len(words), "sumber_berkas": Path(args.source).name,
        "ukuran_shard": args.shard_size, "halaman_per_lema": bool(args.pages),
        "catatan": "Daftar sumber tidak otomatis merupakan daftar resmi KBBI; periksa lisensi dan validitas sumber."
    }
    (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Selesai: {len(words):,} lema unik; {((len(words)-1)//args.shard_size)+1} shard.")
    if args.pages: print(f"Halaman per lema dibuat di: {out.parent / 'kamus'}")

if __name__ == "__main__":
    main()
