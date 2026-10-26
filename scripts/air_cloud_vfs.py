#!/usr/bin/env python3
"""Materialisasi sistem Air Cloud ke airz/airsistem + shard File Manager.

Hasil:
  1. airz/airsistem/**            — ratusan folder & ribuan file sistem nyata
  2. airz/README.md               — dokumentasi root airz
  3. data/trees/<id>/…            — index.json + pages/*.json.gz untuk rute
                                    #fileManager/airz (repo planetbintang/.AIRZ)
Skrip idempoten: folder airsystem & shard ditulis ulang dari nol setiap run.
"""
from __future__ import annotations

import gzip
import hashlib
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

import air_cloud_data as data  # noqa: E402

AIRZ_ROOT = ROOT / "airz"
SYSTEM_ROOT = AIRZ_ROOT / "airsistem"
VIRTUAL_REPO = "planetbintang/.AIRZ"
TREE_ID = hashlib.sha256(VIRTUAL_REPO.encode("utf-8")).hexdigest()[:16]
TREE_ROOT = ROOT / "data" / "trees" / TREE_ID
PAGE_SIZE = 200


def entry(path: str, kind: str, function: str, content: str | None) -> dict:
    item = {
        "path": path,
        "type": "directory" if kind == "DIR" else "file",
        "mode": "040755" if kind == "DIR" else "0100644",
        "sha": "",
    }
    if kind == "FILE":
        size = len((content or "").encode("utf-8"))
        item["size"] = size
        item["sizeKnown"] = True
    if function:
        item["function"] = function
    return item


def build_entries() -> list[dict]:
    tree = data.airsystem_tree()
    entries: list[dict] = [entry("airz", "DIR", "Root penyimpanan langsung sistem Air Cloud di File Manager", None)]
    entries.append(entry("airz/README.md", "FILE", "Dokumentasi root airz/ dan partisi airsistem/", None))
    entries.append(entry("airz/airsistem", "DIR", f"Sistem folder Air Cloud · {len(tree)} folder terkelola (sama seperti IBM Cloud)", None))
    # Semua folder intermediate (mis. airz/airsistem/console, .../menus) wajib ada
    # sebagai entri direktori agar manifest menganggapnya directory valid.
    intermediates: set[str] = set()
    for folder in tree:
        parts = folder.split("/")
        for i in range(1, len(parts)):
            intermediates.add("/".join(parts[:i]))
    for folder in sorted(intermediates):
        if folder not in tree:
            entries.append(entry(f"airz/airsistem/{folder}", "DIR", "Folder induk sistem Air Cloud", None))
    for folder in sorted(tree):
        entries.append(entry(f"airz/airsistem/{folder}", "DIR", None, None))
        for name, kind, function, content in tree[folder]:
            entries.append(entry(f"airz/airsistem/{folder}/{name}", kind, function, content))
    # Konsol mirror
    entries.append(entry("airz/console", "DIR", "Salinan registry halaman konsol Air Cloud", None))
    entries.append(entry("airz/console/menus", "DIR", "Folder per menu utama — mirror hierarki sidebar", None))
    for slug, icon, title, desc, _accent in data.AIR_CLOUD_MENUS:
        entries.append(entry(f"airz/console/menus/{slug}", "DIR", f"{icon} {title} — {desc}", None))
    return entries


def canonical(value):
    if isinstance(value, list):
        return "[" + ",".join(canonical(v) for v in value) + "]"
    if isinstance(value, dict):
        return "{" + ",".join(f"{json.dumps(k, ensure_ascii=False)}:{canonical(value[k])}" for k in sorted(value)) + "}"
    return json.dumps(value, ensure_ascii=False)


def write_json(path: Path, payload: dict) -> str:
    payload["dataSha256"] = hashlib.sha256(canonical(payload).encode("utf-8")).hexdigest()
    path.parent.mkdir(parents=True, exist_ok=True)
    raw = (json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n").encode("utf-8")
    if path.suffix == ".gz":
        path.write_bytes(gzip.compress(raw, compresslevel=6, mtime=0))
    else:
        path.write_bytes(raw)
    return payload["dataSha256"]


def materialize_files() -> tuple[int, int]:
    """Tulis fisik airz/airsistem — mengembalikan (jumlah folder, jumlah file)."""
    if SYSTEM_ROOT.exists():
        shutil.rmtree(SYSTEM_ROOT)
    tree = data.airsystem_tree()
    folders = 0
    files = 0
    AIRZ_ROOT.mkdir(parents=True, exist_ok=True)
    readme = (
        "# Root `airz/` — Penyimpanan Langsung Sistem Air Cloud\n\n"
        "Folder ini adalah tempat sistem Air Cloud menyimpan seluruh struktur file-nya:\n\n"
        "- `airsistem/` — sistem folder & file inti (ratusan folder, ribuan file) — setara partisi sistem IBM Cloud.\n"
        "- `console/` — salinan registry halaman konsol per menu utama.\n\n"
        "Akses dari aplikasi: menu **Air Cloud → Penyimpanan Sistem** atau File Manager pada sub URL `#fileManager/airz/airsistem`.\n"
        f"Dibangun oleh `scripts/air_cloud_vfs.py` · {len(tree)} folder terkelola.\n"
    )
    (AIRZ_ROOT / "README.md").write_text(readme, encoding="utf-8")
    console_readme = "# Registry Halaman Konsol Air Cloud\n\nSatu folder per menu utama; isi lengkap ada di `../airsistem/console/menus`.\n"
    (AIRZ_ROOT / "console" / "README.md").parent.mkdir(parents=True, exist_ok=True)
    (AIRZ_ROOT / "console" / "README.md").write_text(console_readme, encoding="utf-8")
    for slug, icon, title, desc, _a in data.AIR_CLOUD_MENUS:
        menu_dir = AIRZ_ROOT / "console" / "menus" / slug
        menu_dir.mkdir(parents=True, exist_ok=True)
        (menu_dir / "menu.json").write_text(json.dumps({
            "slug": slug, "title": title, "icon": icon, "description": desc,
            "route": f"#aircloud/{slug}", "submenus": [s[0] for s in data.SUB_TEMPLATES],
        }, ensure_ascii=False, indent=1), encoding="utf-8")
        files += 1
        folders += 1
    for folder, items in tree.items():
        base = SYSTEM_ROOT / folder
        base.mkdir(parents=True, exist_ok=True)
        folders += 1
        for name, kind, function, content in items:
            target = base / name
            if kind == "DIR":
                target.mkdir(parents=True, exist_ok=True)
                folders += 1
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(content or "", encoding="utf-8")
                files += 1
    return folders, files


def publish_shards(entries: list[dict]) -> dict:
    local_dir = TREE_ROOT
    if local_dir.exists():
        shutil.rmtree(local_dir)
    local_dir.mkdir(parents=True, exist_ok=True)
    base_url = f"data/trees/{TREE_ID}"

    children: dict[str, list[dict]] = {"": []}
    for item in entries:
        parent = item["path"].rsplit("/", 1)[0] if "/" in item["path"] else ""
        children.setdefault(parent, []).append(item)
        if item["type"] == "directory":
            children.setdefault(item["path"], [])

    directories: dict[str, dict] = {}
    total_pages = 0
    for directory in sorted(children, key=lambda p: (p.count("/"), p.casefold(), p)):
        values = children[directory]
        page_refs = []
        for page_no, start in enumerate(range(0, len(values), PAGE_SIZE)):
            page_items = values[start:start + PAGE_SIZE]
            key = hashlib.sha256(f"airz\0{directory}\0{page_no}".encode("utf-8")).hexdigest()[:32]
            relative = f"pages/{key}.json.gz"
            payload = {
                "schemaVersion": 1,
                "repository": VIRTUAL_REPO,
                "path": directory,
                "page": page_no,
                "pageSize": PAGE_SIZE,
                "entryCount": len(page_items),
                "entries": page_items,
            }
            sha = write_json(local_dir / relative, payload)
            page_refs.append({"url": f"{base_url}/{relative}", "count": len(page_items), "sha256": sha})
            total_pages += 1
        directories[directory] = {"entryCount": len(values), "pages": page_refs}

    stats = data.tree_stats()
    index_payload = {
        "schemaVersion": 1,
        "repository": VIRTUAL_REPO,
        "branch": "main",
        "headSha": "",
        "treeSha": "",
        "state": "complete",
        "entryCount": len(entries),
        "fileCount": sum(1 for e in entries if e["type"] == "file"),
        "directoryCount": sum(1 for e in entries if e["type"] == "directory"),
        "submoduleCount": 0,
        "totalBytes": sum(int(e.get("size") or 0) for e in entries if e["type"] == "file"),
        "executableFileCount": 0,
        "sizeUnknownCount": 0,
        "redactedCount": 0,
        "fallbackUsed": False,
        "gitFallbackUsed": False,
        "virtual": True,
        "airCloud": True,
        "rootVirtual": "/airz — penyimpanan langsung sistem Air Cloud",
        "roots": [
            {"path": "airz", "title": "/airz", "desc": "Penyimpanan langsung sistem Air Cloud (folder airz/)",
             "subUrl": "#fileManager/airz",
             "items": sum(1 for e in entries if e["path"] == "airz" or e["path"].startswith("airz/"))},
        ],
        "summary": {
            "folders": stats["folders"],
            "files": stats["files"],
            "topFolders": stats["topFolders"],
            "mainMenus": data.MAIN_MENU_COUNT,
            "subMenus": data.SUB_MENU_COUNT,
            "leafMenus": data.LEAF_MENU_COUNT,
            "totalMenus": data.TOTAL_MENU_COUNT,
        },
        "directories": directories,
    }
    index_sha = write_json(local_dir / "index.json", index_payload)
    return {"entries": len(entries), "pages": total_pages, "indexUrl": f"{base_url}/index.json", "indexSha256": index_sha,
            "treeId": TREE_ID}


def main() -> None:
    entries = build_entries()
    folders, files = materialize_files()
    result = publish_shards(entries)
    print(json.dumps({"physical": {"folders": folders, "files": files}, **result}, indent=2))


if __name__ == "__main__":
    main()
