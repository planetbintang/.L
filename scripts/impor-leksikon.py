#!/usr/bin/env python3
"""Validasi korpus JSONL leksikon; tidak mengarang definisi atau data KBBI."""
from __future__ import annotations
import argparse, json, re, unicodedata
from pathlib import Path

def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.lower())
    value = "".join(c for c in value if not unicodedata.combining(c))
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value or "lema"

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="JSONL korpus yang legal digunakan")
    parser.add_argument("--output", type=Path, default=Path("leksikon/data/lema.json"))
    args = parser.parse_args()
    rows, seen = [], set()
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
            row["lemma"] = lemma
            row["slug"] = slugify(lemma)
            row.setdefault("definition", "")
            row.setdefault("paragraph", "")
            row.setdefault("partOfSpeech", "")
            row.setdefault("examples", [])
            row.setdefault("etymology", "")
            row.setdefault("variants", [])
            row.setdefault("synonyms", [])
            row.setdefault("antonyms", [])
            row.setdefault("relatedTerms", [])
            row.setdefault("source", "")
            row.setdefault("sourceUrl", "")
            row.setdefault("license", "")
            row.setdefault("reviewStatus", "belum-diverifikasi")
            row["utf8Binary"] = " ".join(f"{b:08b}" for b in lemma.encode("utf-8"))
            row.setdefault("icConcept", "teks → normalisasi → indeks lema → panel tampilan")
            row.setdefault("logoSymbol", "📚")
            rows.append(row)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Valid: {len(rows)} lema unik; keluaran: {args.output}")
    print("Jumlah ini adalah data yang benar-benar diimpor, bukan target 250.000.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
