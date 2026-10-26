#!/usr/bin/env python3
"""Bangun halaman JSON menu Air Cloud (ratusan halaman berbeda) + indeks JS.

Mengikuti pola pipeline enterprise: satu file JSON per menu utama & submenu
tingkat-2 sehingga aplikasi dapat memuat "halaman" per menu dari
`data/air-cloud-menus/`, dengan indeks nama-file di
`data/air-cloud-menus-index.js` (window.PB_AIR_CLOUD_MENU_INDEX).
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

import air_cloud_data as data  # noqa: E402

OUT_DIR = ROOT / "data" / "air-cloud-menus"
INDEX_JS = ROOT / "data" / "air-cloud-menus-index.js"


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def accent_for(row: dict) -> str:
    for slug, _icon, _title, _desc, accent in data.AIR_CLOUD_MENUS:
        if slug == row["group_slug"]:
            return accent
    return "#1d5bea"


def page_blocks(row: dict) -> list[dict]:
    """Konten halaman per menu — blok yang sama dipakai renderer konsol."""
    icon = row.get("icon") or "☁️"
    title = row["menu_name"]
    level = row["level"]
    children = [r for r in data.MASTER_ROWS if r["parent_id"] == row["id"]]
    blocks = [
        {"type": "hero", "icon": icon, "title": title, "text": row["short_description"],
         "code": row["menu_code"], "route": row["route_path"], "accent": accent_for(row)},
        {"type": "metrics", "items": [
            {"label": "Level Menu", "value": f"L{level}"},
            {"label": "Anak Langsung", "value": len(children)},
            {"label": "Region Aktif", "value": len(data.REGIONS)},
            {"label": "Status Layanan", "value": "OPERASIONAL"},
        ]},
        {"type": "children", "title": "Struktur Navigasi",
         "items": [{"id": c["id"], "title": c["menu_name"], "level": c["level"],
                    "path": c["path_label"], "route": c["route_path"]} for c in children[:60]]},
        {"type": "table", "title": "Instance simulasi",
         "columns": ["ID", "Wilayah", "Status", "Tag Biaya", "Pembaruan"],
         "rows": [[f"{row['id'].lower()}-{i:03d}", data.REGIONS[i % len(data.REGIONS)],
                   ["Aktif", "Aktif", "Menjaga", "Aktif", "Draf"][i % 5],
                   f"env:{['dev', 'stg', 'prd'][i % 3]} team:platform",
                   f"2026-10-{(i % 25) + 1:02d}"] for i in range(8)]},
        {"type": "docs", "title": "Instruksi sistem",
         "text": (f"Instruksi modul '{title}': semua perubahan konfigurasi disinkron ke "
                  f"penyimpanan langsung `airz/airsistem/console/menus/{row['group_slug']}` "
                  "(atau partisi submenu terkait), diverifikasi SHA-256, lalu dipantulkan ke File Manager."),
         "actions": ["Buka penyimpanan airz/", "Unduh manifest halaman", "Sinkronkan shard File Manager"]},
    ]
    return blocks


def build_pages() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    index: dict[str, str] = {}
    rows = [r for r in data.MASTER_ROWS if r["level"] <= 2]   # 26 + 312 = 338 halaman JSON
    for row in rows:
        fname = f"{slugify(row['group_slug'])}-{slugify(row['menu_name'])}-{row['id']}.json"
        payload = {
            "id": row["id"],
            "menu_code": row["menu_code"],
            "parent_id": row["parent_id"],
            "level": row["level"],
            "group_slug": row["group_slug"],
            "icon": row["icon"],
            "menu_name": row["menu_name"],
            "path_label": row["path_label"],
            "route_path": row["route_path"],
            "short_description": row["short_description"],
            "is_active": True,
            "language_code": "id",
            "fileName": fname,
            "system_instruction": (f"Halaman konsol Air Cloud '{row['path_label']}' — bagian dari registry "
                                   f"{data.TOTAL_MENU_COUNT} menu (26 utama · {data.SUB_MENU_COUNT} submenu · "
                                   f"{data.LEAF_MENU_COUNT} sub-sub menu)."),
            "blocks": page_blocks(row),
        }
        (OUT_DIR / fname).write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        key = row["id"]
        index[key] = fname
    header = ("// Dihasilkan scripts/build_air_cloud_menus.py — peta ID menu Air Cloud -> nama file halaman.\n"
              "// Dimuat lebih dulu oleh air-cloud-console.js (window.PB_AIR_CLOUD_MENU_INDEX).\n")
    INDEX_JS.write_text(header + "window.PB_AIR_CLOUD_MENU_INDEX = "
                        + json.dumps(index, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    manifest = {
        "schemaVersion": 1,
        "source": "scripts/build_air_cloud_menus.py",
        "pageCount": len(rows),
        "mainMenus": data.MAIN_MENU_COUNT,
        "subMenus": data.SUB_MENU_COUNT,
        "leafMenus": data.LEAF_MENU_COUNT,
        "totalRegistry": data.TOTAL_MENU_COUNT,
        "storageRoot": "airz/airsistem",
        "treeId": "6c16f20482a78201",
        "directories": sorted(d[0] for d in [(f["group_slug"],) for f in rows[:26]]),
    }
    (ROOT / "data" / "air-cloud-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps({"pages": len(rows), "indexKeys": len(index)}, indent=2))


if __name__ == "__main__":
    build_pages()
