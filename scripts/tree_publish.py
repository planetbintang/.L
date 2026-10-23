#!/usr/bin/env python3
"""Publish a Git tree as lazy-loadable, page-sized static directory shards."""
from __future__ import annotations

import hashlib
import gzip
import json
import shutil
from pathlib import Path

PAGE_SIZE = 500


def _canonical_sha(payload: dict) -> str:
    canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(canonical).hexdigest()


def _write_json(path: Path, payload: dict) -> str:
    payload["dataSha256"] = _canonical_sha(payload)
    path.parent.mkdir(parents=True, exist_ok=True)
    raw = (json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n").encode("utf-8")
    if path.suffix == ".gz":
        path.write_bytes(gzip.compress(raw, compresslevel=6, mtime=0))
    else:
        path.write_bytes(raw)
    return payload["dataSha256"]


def publish_tree_shards(repositories: list[dict], tree_root: Path) -> dict:
    """Write one manifest per repo and bounded JSON pages per directory."""
    total_pages = 0
    total_entries = 0
    total_bytes = 0
    for repo in repositories:
        full_name = str(repo.get("fullName") or repo.get("name") or "unknown")
        tree = repo.setdefault("tree", {})
        entries = tree.pop("entries", [])
        if not isinstance(entries, list):
            entries = []
        repo_id = hashlib.sha256(full_name.encode("utf-8")).hexdigest()[:16]
        local_dir = tree_root / repo_id
        if local_dir.exists():
            shutil.rmtree(local_dir)
        local_dir.mkdir(parents=True, exist_ok=True)
        base_url = f"data/trees/{repo_id}"

        children: dict[str, list[dict]] = {"": []}
        for entry in entries:
            path = str(entry.get("path") or "")
            if not path:
                continue
            parent = path.rsplit("/", 1)[0] if "/" in path else ""
            children.setdefault(parent, []).append(entry)
            if entry.get("type") == "directory":
                children.setdefault(path, [])
        for values in children.values():
            values.sort(key=lambda e: (e.get("type") != "directory", str(e.get("path", "")).rsplit("/", 1)[-1].casefold(), str(e.get("path", ""))))

        directories: dict[str, dict] = {}
        repo_pages = 0
        for directory in sorted(children, key=lambda p: (p.count("/"), p.casefold(), p)):
            values = children[directory]
            page_refs = []
            for page_no, start in enumerate(range(0, len(values), PAGE_SIZE)):
                page_items = values[start:start + PAGE_SIZE]
                key = hashlib.sha256(f"{full_name}\0{directory}\0{page_no}".encode("utf-8")).hexdigest()[:32]
                relative = f"pages/{key}.json.gz"
                page_payload = {
                    "schemaVersion": 1,
                    "repository": full_name,
                    "path": directory,
                    "page": page_no,
                    "pageSize": PAGE_SIZE,
                    "entryCount": len(page_items),
                    "entries": page_items,
                }
                sha = _write_json(local_dir / relative, page_payload)
                page_refs.append({"url": f"{base_url}/{relative}", "count": len(page_items), "sha256": sha})
                repo_pages += 1
            directories[directory] = {"entryCount": len(values), "pages": page_refs}

        index_payload = {
            "schemaVersion": 1,
            "repository": full_name,
            "branch": repo.get("branch", ""),
            "headSha": repo.get("headSha", ""),
            "treeSha": tree.get("treeSha", ""),
            "state": tree.get("state", "unavailable"),
            "entryCount": tree.get("entryCount", len(entries)),
            "fileCount": tree.get("fileCount", 0),
            "directoryCount": tree.get("directoryCount", 0),
            "submoduleCount": tree.get("submoduleCount", 0),
            "totalBytes": tree.get("totalBytes", 0),
            "executableFileCount": tree.get("executableFileCount", 0),
            "sizeUnknownCount": tree.get("sizeUnknownCount", 0),
            "redactedCount": tree.get("redactedCount", 0),
            "fallbackUsed": bool(tree.get("fallbackUsed")),
            "gitFallbackUsed": bool(tree.get("gitFallbackUsed")),
            "directories": directories,
        }
        index_sha = _write_json(local_dir / "index.json", index_payload)
        tree["indexUrl"] = f"{base_url}/index.json"
        tree["indexSha256"] = index_sha
        tree["pageSize"] = PAGE_SIZE
        tree["entries"] = []
        repo["tree"] = tree
        total_pages += repo_pages
        total_entries += len(entries)
        total_bytes += sum(int(entry.get("size") or 0) for entry in entries if entry.get("type") == "file")

    return {"repositories": len(repositories), "entries": total_entries, "pages": total_pages, "sourceBytes": total_bytes}
