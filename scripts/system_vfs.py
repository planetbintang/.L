#!/usr/bin/env python3
"""Bangun shard statis untuk folder virtual sistem pada repository `.L`.

Root virtual (sub URL `planetbintang.github.io/.L/` → File Manager path `/`):
    /data /proc /sys /media /acct /pro /config /cache
Setiap folder adalah sub-URL File Manager (`#fileManager/data`, `#fileManager/proc`, ...)
dengan tampilan dan pengaturan terpusat per folder (ROOT SETTINGS pada inspector).

Setiap folder berisi subfolder khas sistem beserta file yang memiliki nama,
ekstensi, ukuran, mode, fungsi, dan isi kode contoh sesuai nama/fungsi foldernya
(source snippet ringkas — metadata struktural, bukan blob repo nyata). Struktur
mengikuti skema shard yang sama dengan pohon Git (index.json + pages/*.json.gz)
sehingga file-manager.js membacanya tanpa perubahan protokol.
"""
from __future__ import annotations

import hashlib
import json
import shutil
import sys
from pathlib import Path

sys_path = Path(__file__).resolve().parent
if str(sys_path) not in __import__("sys").path:
    __import__("sys").path.insert(0, str(sys_path))

ROOT = Path(__file__).resolve().parents[1]
TREE_ROOT = ROOT / "data" / "trees"
VFS_ID = "0000000000000000"
PAGE_SIZE = 500

# (nama, jenis, ukuran byte atau None, mode, fungsi)

import vfs_data  # noqa: E402  (data struktur root virtual + isi kode contoh)

ROOT_ORDER = vfs_data.ROOT_ORDER
ROOT_META = vfs_data.ROOT_META
EXTENSION_FUNCTION = vfs_data.EXTENSION_FUNCTION
SYSTEM_TREE = vfs_data.SYSTEM_TREE
SAMPLE_FILES = vfs_data.SAMPLE_FILES


def ext_of(name: str) -> str:
    dot = name.rfind(".")
    return name[dot + 1:].upper() if dot > 0 else ""


def function_for(name: str, fallback: str) -> str:
    e = ext_of(name)
    if e and e in EXTENSION_FUNCTION:
        return EXTENSION_FUNCTION[e]
    return fallback


VIRTUAL_REPO = "planetbintang/.L"
SUB_URL_BASE = "#fileManager/"


def walk(prefix: str, items: list[tuple], out: list[dict]) -> None:
    """Rekursif: folder punya fungsi + sub-URL; file punya ekstensi, fungsi, dan isi kode contoh."""
    for name, kind, size, mode, func, *rest in items:
        content = rest[0] if rest else ""
        path = f"{prefix}/{name}" if prefix else name
        if kind == "DIR":
            entry = {"path": path, "type": "directory", "sha": "", "mode": mode or "040755",
                     "size": 0, "sizeKnown": True, "function": func,
                     "subUrl": f"{SUB_URL_BASE}{path}",
                     "managed": True}
            out.append(entry)
            nested = SAMPLE_FILES.get(path) or SAMPLE_FILES.get(name)
            if nested:
                walk(path, nested, out)
        else:
            out.append({"path": path, "type": "file", "sha": "", "mode": mode or "100644",
                        "size": int(len(content.encode("utf-8")) or size or 0), "sizeKnown": True,
                        "function": func or function_for(name, "File sistem"),
                        "extension": ext_of(name) or None,
                        "codeContent": content or None})


def build_entries() -> list[dict]:
    entries: list[dict] = []
    for top in ROOT_ORDER:
        meta = ROOT_META[top]
        entries.append({"path": top, "type": "directory", "sha": "", "mode": "040755",
                        "size": 0, "sizeKnown": True,
                        "function": meta["desc"], "title": meta["title"],
                        "subUrl": meta["sub_url"], "managed": True,
                        "centralized": True})
        walk(top, SYSTEM_TREE[top], entries)
    entries.sort(key=lambda item: (ROOT_ORDER.index(item["path"].split("/")[0]),
                                   item["path"].count("/"),
                                   item["type"] != "directory",
                                   item["path"].rsplit("/", 1)[-1].casefold(), item["path"]))
    return entries


def canonical_sha(payload: dict) -> str:
    canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(canonical).hexdigest()


def write_json(path: Path, payload: dict) -> str:
    import gzip
    payload["dataSha256"] = canonical_sha(payload)
    path.parent.mkdir(parents=True, exist_ok=True)
    raw = (json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n").encode("utf-8")
    if path.suffix == ".gz":
        path.write_bytes(gzip.compress(raw, compresslevel=6, mtime=0))
    else:
        path.write_bytes(raw)
    return payload["dataSha256"]


def publish() -> dict:
    entries = build_entries()
    local_dir = TREE_ROOT / VFS_ID
    if local_dir.exists():
        shutil.rmtree(local_dir)
    local_dir.mkdir(parents=True, exist_ok=True)
    base_url = f"data/trees/{VFS_ID}"

    children: dict[str, list[dict]] = {"": []}
    for entry in entries:
        parent = entry["path"].rsplit("/", 1)[0] if "/" in entry["path"] else ""
        children.setdefault(parent, []).append(entry)
        if entry["type"] == "directory":
            children.setdefault(entry["path"], [])

    directories: dict[str, dict] = {}
    total_pages = 0
    for directory in sorted(children, key=lambda p: (p.count("/"), p.casefold(), p)):
        values = children[directory]
        page_refs = []
        for page_no, start in enumerate(range(0, len(values), PAGE_SIZE)):
            page_items = values[start:start + PAGE_SIZE]
            key = hashlib.sha256(f"vfs\0{directory}\0{page_no}".encode("utf-8")).hexdigest()[:32]
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
        "rootVirtual": "/.L — sub URL planetbintang.github.io/.L/",
        "roots": [
            {"path": top, "title": ROOT_META[top]["title"], "desc": ROOT_META[top]["desc"],
             "subUrl": ROOT_META[top]["sub_url"],
             "items": sum(1 for e in entries if e["path"] == top or e["path"].startswith(f"{top}/"))}
            for top in ROOT_ORDER
        ],
        "directories": directories,
    }
    index_sha = write_json(local_dir / "index.json", index_payload)
    return {"entries": len(entries), "pages": total_pages, "indexUrl": f"{base_url}/index.json", "indexSha256": index_sha}


if __name__ == "__main__":
    result = publish()
    print(json.dumps(result, indent=2))
    sys.exit(0)
