#!/usr/bin/env python3
"""Generate the browser-safe REIC Environment menu catalog."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "vmdesktopreic" / "environment" / "menu-catalog-25000.json"

categories = [
    ("Ruang Kerja", "workspace"), ("Berkas", "files"), ("Aplikasi", "apps"),
    ("Jendela", "windows"), ("Tampilan", "display"), ("Personalisasi", "personalization"),
    ("Tema", "themes"), ("Warna", "colors"), ("Tipografi", "typography"),
    ("Aksesibilitas", "accessibility"), ("Bahasa", "language"), ("Waktu", "time"),
    ("Notifikasi", "notifications"), ("Papan Klip", "clipboard"), ("Pencarian", "search"),
    ("Penyimpanan", "storage"), ("Pencadangan", "backup"), ("Pemulihan", "recovery"),
    ("Keamanan", "security"), ("Privasi", "privacy"), ("Jaringan", "network"),
    ("Sinkronisasi", "sync"), ("Pengembang", "developer"), ("Otomasi", "automation"),
    ("Diagnostik", "diagnostics"),
]
actions = ["Lihat", "Buka", "Atur", "Aktifkan", "Nonaktifkan", "Uji", "Validasi", "Ekspor", "Impor", "Reset"]
scopes = ["sistem", "sesi", "pengguna", "proyek", "komponen", "profil", "ruang-kerja", "runtime"]
items = []
for category_index, (category, slug) in enumerate(categories):
    for local_index in range(1000):
        number = category_index * 1000 + local_index + 1
        action = actions[local_index % len(actions)]
        scope = scopes[(local_index // len(actions)) % len(scopes)]
        items.append({
            "id": f"ENV-{number:05d}",
            "menu": f"{category} · {local_index + 1:04d}",
            "category": category,
            "categoryId": slug,
            "action": action,
            "scope": scope,
            "description": f"{action} konfigurasi {category.lower()} untuk ruang {scope} REIC.",
            "execution": "preview",
            "permission": "environment.read" if action in {"Lihat", "Buka", "Uji", "Validasi"} else "environment.configure",
        })

payload = {
    "schemaVersion": 1,
    "name": "VMDESKTOPREIC Environment Menu Catalog",
    "system": "REIC",
    "totalMenus": len(items),
    "categoryCount": len(categories),
    "executionPolicy": "preview-by-default",
    "writePolicy": "requires-reviewed-adapter",
    "categories": [{"id": slug, "name": name, "count": 1000} for name, slug in categories],
    "menus": items,
}
OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"generated {OUT} ({len(items)} menus)")
