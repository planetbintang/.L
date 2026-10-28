#!/usr/bin/env python3
"""Generate 1,500 menu-named TXT files containing exactly 25,000 UI definitions.

Run from repository root:
  python3 tools/buat-berkas-antarmuka-txt.py

Output:
  osmediavm/pusat_registri/berkas-txt/
Each TXT file corresponds to one registered modal/menu. File names use the menu
name (normalized to a filesystem-safe Indonesian slug); duplicate names receive
a numeric suffix. Definitions describe menu, button, layout, position, and size.
"""
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "osmediavm/pusat_registri/daftar-menu.json"
OUT = ROOT / "osmediavm/pusat_registri/berkas-txt"
TARGET_DEFINITIONS = 25_000
KINDS = [
    "Menu", "Tombol", "Layout", "Posisi", "Ukuran", "Dialog", "Panel",
    "Toolbar", "Navigasi", "Kartu", "Kontrol", "Jendela", "Ikon",
    "Formulir", "Tab", "Notifikasi", "Aksesibilitas",
]
LAYOUTS = [
    "grid responsif", "flex horizontal", "flex vertikal", "sidebar kiri",
    "sidebar kanan", "toolbar atas", "toolbar bawah", "panel terpusat",
    "dua kolom", "tiga kolom", "kanvas penuh", "daftar bertingkat",
    "kartu adaptif", "dock mengambang", "dialog terpusat", "lembar samping",
    "panel bertumpuk",
]
POSITIONS = [
    "atas-kiri", "atas-tengah", "atas-kanan", "tengah-kiri", "tengah",
    "tengah-kanan", "bawah-kiri", "bawah-tengah", "bawah-kanan",
    "mengikuti-alur", "tetap", "mengambang", "menempel-atas",
    "menempel-bawah", "modal-terpusat", "panel-samping", "di-dalam-konten",
]
SIZES = [
    "xs", "sm", "md", "lg", "xl", "penuh", "otomatis", "responsif",
    "kompak", "normal", "luas", "ikon", "teks", "sentuh", "adaptif",
    "maksimum", "minimum",
]

def slug(value):
    value = unicodedata.normalize("NFKD", str(value))
    value = "".join(c for c in value if not unicodedata.combining(c))
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or "menu"

def main():
    data = json.loads(REGISTRY.read_text(encoding="utf-8"))
    menus = data.get("menu", [])
    if len(menus) != 1500:
        raise SystemExit(f"Registri diharapkan berisi 1500 menu; ditemukan {len(menus)}")
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.txt"):
        old.unlink()

    manifest = []
    definition_count = 0
    used_names = set()
    for i, menu in enumerate(menus, 1):
        title = menu.get("namaFitur") or menu.get("judul") or menu.get("slug") or f"Menu {i}"
        base = slug(title)
        filename = base + ".txt"
        duplicate = 2
        while filename.casefold() in used_names:
            filename = f"{base}-{duplicate}.txt"
            duplicate += 1
        used_names.add(filename.casefold())

        remaining = TARGET_DEFINITIONS - definition_count
        component_count = min(len(KINDS), max(0, remaining))
        lines = [
            "OS MEDIA VM — BERKAS DEFINISI ANTARMUKA",
            "=" * 46,
            f"ID REGISTRI : {menu.get('id', str(i).zfill(4))}",
            f"NAMA MENU  : {menu.get('judul', title)}",
            f"FITUR      : {title}",
            f"SLUG       : {menu.get('slug', '')}",
            f"URL MODAL  : {menu.get('url', '')}",
            f"DESKRIPSI  : {menu.get('deskripsi', '')}",
            f"PETUNJUK   : {menu.get('petunjuk', '')}",
            "",
            "DEFINISI KOMPONEN",
            "-" * 46,
        ]
        for j, kind in enumerate(KINDS[:component_count]):
            number = definition_count + 1
            lines.extend([
                "",
                f"[{number:05d}] {kind.upper()}",
                f"Nama       : {title} — {kind}",
                f"Tombol     : {('Buka ' + title) if kind == 'Tombol' else 'Pilih / buka / tutup sesuai konteks'}",
                f"Layout     : {LAYOUTS[(i + j) % len(LAYOUTS)]}",
                f"Posisi     : {POSITIONS[(i * 2 + j) % len(POSITIONS)]}",
                f"Ukuran     : {SIZES[(i + j * 2) % len(SIZES)]}",
                "Responsif  : ya",
                "Aksesibilitas: label jelas, fokus keyboard, kontras memadai",
                "Penutupan  : tombol tutup dan Escape bila berupa dialog",
                f"Ringkasan  : {menu.get('ringkasan', title)}",
            ])
            definition_count += 1
        lines.extend([
            "",
            "CATATAN RUNTIME",
            "Berkas ini mendeskripsikan antarmuka web. Aksi OS host membutuhkan adapter",
            "runtime dengan izin sesuai; definisi TXT tidak menjalankan aksi sendiri.",
            "",
        ])
        (OUT / filename).write_text("\n".join(lines), encoding="utf-8")
        manifest.append({
            "file": filename,
            "menu": menu.get("judul", title),
            "id": menu.get("id", str(i).zfill(4)),
            "definitions": component_count,
        })

    (OUT / "INDEKS-BERKAS.txt").write_text(
        "INDEKS BERKAS TXT OS MEDIA VM\n"
        f"Jumlah berkas menu: {len(manifest)}\n"
        f"Jumlah definisi komponen: {definition_count}\n\n"
        + "\n".join(f"{x['id']} | {x['menu']} | {x['file']} | {x['definitions']} definisi" for x in manifest)
        + "\n",
        encoding="utf-8",
    )
    print(f"Selesai: {len(manifest)} file menu + 1 indeks; {definition_count:,} definisi komponen.")
    print(f"Lokasi: {OUT.relative_to(ROOT)}")

if __name__ == "__main__":
    main()
