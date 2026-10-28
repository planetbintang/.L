#!/usr/bin/env python3
"""Bangun folder dan halaman per lema dari korpus JSONL yang sah digunakan.

Contoh:
  python scripts/bangun-folder-leksikon.py data-lema.jsonl
  python scripts/bangun-folder-leksikon.py data-lema.jsonl --limit 250000

Data definisi tidak direka. Entri tanpa definisi diberi label belum diverifikasi.
"""
from __future__ import annotations
import argparse, html, json, re, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "leksikon" / "kata"

def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.lower())
    value = "".join(c for c in value if not unicodedata.combining(c))
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value or "lema"

def esc(value) -> str:
    return html.escape(str(value or ""), quote=True)

def binary(value: str) -> str:
    return " ".join(f"{b:08b}" for b in value.encode("utf-8"))

def page(row: dict, folder: str) -> str:
    lemma = esc(row["lemma"])
    definition = esc(row.get("definition") or "Makna belum diisi atau belum diverifikasi dari sumber yang berizin.")
    paragraph = esc(row.get("paragraph") or "Entri ini merupakan bagian dari katalog leksikon. Lengkapi uraian dengan konteks dan rujukan yang sah sebelum menandainya terverifikasi.")
    pos = esc(row.get("partOfSpeech") or "Belum ditentukan")
    status = esc(row.get("reviewStatus") or "belum-diverifikasi")
    source = esc(row.get("source") or "Belum dicantumkan")
    source_url = esc(row.get("sourceUrl") or "")
    examples = row.get("examples") or []
    example_html = "".join(f"<li>{esc(x)}</li>" for x in examples) or "<li>Contoh belum ditambahkan.</li>"
    related = row.get("relatedTerms") or []
    related_html = ", ".join(esc(x) for x in related) or "Belum ditambahkan"
    synonyms = row.get("synonyms") or []
    antonyms = row.get("antonyms") or []
    variants = row.get("variants") or []
    etymology = esc(row.get("etymology") or "Belum tersedia")
    bytes_text = esc(binary(row["lemma"]))
    source_link = f'<a href="{source_url}" rel="noopener noreferrer">{source}</a>' if source_url.startswith(("https://","http://")) else source
    code = esc(f'LEMA = "{row["lemma"]}"\nTEKS → NORMALISASI → INDEKS → PANEL\nDATA → [ IC / SIMBOL ] → TAMPILAN\nUTF8_BINER = "{binary(row["lemma"])}"')
    return f'''<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Entri leksikon {lemma}: identitas, deskripsi, kelas kata, biner UTF-8, dan hubungan konseptual IC.">
<title>{lemma} · Leksikon Planetbintang</title>
<style>
:root{{color-scheme:dark;--bg:#06111f;--panel:#0b1e31;--line:#25435c;--ink:#edf7ff;--muted:#a9c1d8;--cyan:#66e1ff;--gold:#ffc978}}
*{{box-sizing:border-box}}body{{margin:0;background:linear-gradient(145deg,#050d18,#07182a 70%,#08101c);color:var(--ink);font:16px/1.65 system-ui,sans-serif}}main{{width:min(1000px,100%);margin:auto;padding:24px}}a{{color:var(--cyan)}}header,section{{border:1px solid var(--line);background:var(--panel);padding:18px;margin-bottom:14px}}.muted{{color:var(--muted)}}.tag{{display:inline-block;border:1px solid var(--line);padding:3px 8px;font-size:12px}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}}pre{{white-space:pre-wrap;overflow-wrap:anywhere;background:#030d17;border:1px solid var(--line);padding:14px;color:var(--gold)}}h1{{font-size:clamp(28px,6vw,48px);margin:8px 0}}dt{{color:var(--cyan);font-weight:700}}dd{{margin:0 0 10px;overflow-wrap:anywhere}}footer{{color:var(--muted);font-size:12px}}button{{padding:9px 12px;background:#10304a;color:var(--ink);border:1px solid #3d6d8e}}
</style></head><body><main>
<header><div class="muted">PLANETBINTANG · LEKSIKON DIGITAL</div><h1>{lemma}</h1><span class="tag">Kelas kata: {pos}</span> <span class="tag">Status: {status}</span><p><a href="../../index.html">← Kembali ke leksikon</a> · <a target="_blank" rel="noopener noreferrer" href="https://kbbi.kemendikdasmen.go.id/entri/{esc(row["lemma"])}">Periksa KBBI resmi ↗</a></p></header>
<section><h2>Deskripsi kata</h2><p>{definition}</p><p>{paragraph}</p><dl><dt>Identitas lema</dt><dd>{lemma}</dd><dt>Jalur folder</dt><dd><code>/leksikon/kata/{esc(folder)}/index.html</code></dd><dt>Etimologi</dt><dd>{etymology}</dd><dt>Variasi</dt><dd>{esc(", ".join(variants) or "Belum ditambahkan")}</dd><dt>Sinonim</dt><dd>{esc(", ".join(synonyms) or "Belum ditambahkan")}</dd><dt>Antonim</dt><dd>{esc(", ".join(antonyms) or "Belum ditambahkan")}</dd><dt>Kata terkait</dt><dd>{related_html}</dd><dt>Sumber</dt><dd>{source_link}</dd></dl></section>
<div class="grid"><section><h2>Contoh penggunaan</h2><ul>{example_html}</ul></section><section><h2>Representasi biner UTF-8</h2><p>Setiap kelompok 8 bit mewakili satu bita dari pengodean UTF-8, bukan instruksi prosesor.</p><pre>{bytes_text}</pre></section></div>
<section><h2>Blok kode dan hubungan IC</h2><pre>{code}</pre><p>Diagram ini adalah dokumentasi konseptual alur data dari kata menuju indeks dan komponen tampilan. Ia tidak menyimulasikan rangkaian listrik atau gerbang logika fisik.</p><p>Simbol kategori: 📚 · 🌐 · 🔎 · IC</p></section>
<footer>Data sumber: {source}. Status lema harus diperiksa terhadap sumber berizin. Halaman ini tidak mengklaim sebagai salinan resmi KBBI.</footer>
</main></body></html>'''

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Berkas JSONL; satu objek per baris")
    parser.add_argument("--limit", type=int, default=250000, help="Maksimum lema untuk dibangun")
    parser.add_argument("--output", type=Path, default=OUT, help="Folder keluaran")
    args = parser.parse_args()
    seen, rows, slug_owner = set(), [], {}
    with args.input.open(encoding="utf-8") as stream:
        for line_no, line in enumerate(stream, 1):
            if not line.strip():
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError as exc:
                raise SystemExit(f"Baris {line_no}: JSON tidak valid: {exc}")
            lemma = str(row.get("lemma", "")).strip()
            if not lemma:
                raise SystemExit(f"Baris {line_no}: bidang lemma wajib diisi")
            key = lemma.casefold()
            if key in seen:
                continue
            seen.add(key)
            slug = slugify(lemma)
            # Hindari tabrakan slug untuk lema berbeda.
            if slug in slug_owner and slug_owner[slug] != key:
                slug += "-" + str(len(rows) + 1)
            slug_owner[slug] = key
            row["lemma"], row["slug"] = lemma, slug
            row.setdefault("reviewStatus", "belum-diverifikasi")
            rows.append(row)
            if len(rows) >= args.limit:
                break
    args.output.mkdir(parents=True, exist_ok=True)
    index = []
    for i, row in enumerate(rows, 1):
        folder = row["slug"]
        dest = args.output / folder
        dest.mkdir(parents=True, exist_ok=True)
        (dest / "index.html").write_text(page(row, folder), encoding="utf-8")
        index.append({"lemma": row["lemma"], "slug": folder, "path": f"{folder}/index.html", "reviewStatus": row["reviewStatus"]})
        if i % 5000 == 0:
            print(f"Dibangun: {i} folder lema")
    (args.output / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (args.output / "index.html").write_text('''<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Katalog Kata · Planetbintang</title><style>body{font:16px/1.6 system-ui;background:#06111f;color:#edf7ff;max-width:900px;margin:auto;padding:24px}a{color:#66e1ff}input{padding:10px;width:95%}li{margin:7px 0}</style></head><body><h1>Katalog Kata Bahasa Indonesia</h1><p>Folder kata dibuat dari korpus yang diberikan. Status verifikasi setiap lema harus diperiksa.</p><input id="q" placeholder="Cari lema…" type="search"><p id="count"></p><ul id="list"></ul><script>fetch("./index.json").then(r=>r.json()).then(data=>{const q=document.querySelector("#q"),list=document.querySelector("#list"),count=document.querySelector("#count");function draw(){const s=q.value.toLocaleLowerCase("id"),rows=data.filter(x=>x.lemma.toLocaleLowerCase("id").includes(s)).slice(0,500);count.textContent=rows.length+" entri ditampilkan dari "+data.length+" lema terindeks";list.innerHTML=rows.map(x=>'<li><a href="./'+encodeURIComponent(x.slug)+'/">'+x.lemma.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))+'</a> <small>'+x.reviewStatus+'</small></li>').join("")}q.addEventListener("input",draw);draw()})</script></body></html>''', encoding="utf-8")
    print(f"Selesai: {len(rows)} folder lema dibuat di {args.output}")
    print("Folder dibuat dari data yang tersedia; target 250.000 bukan bukti bahwa 250.000 lema sudah diimpor.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
