#!/usr/bin/env python3
"""Read-only Git tree indexer for the Planetbintang static dashboard.

Fetches only Git tree objects (paths, modes, blob/tree SHAs, and sizes). It
never fetches blob contents and never executes repository code. Paths that look
like secrets, credentials, private keys, environment files, or dumps are omitted.
"""
from __future__ import annotations

import base64
import json
import os
import re
import subprocess
import tempfile
import time
from collections import deque
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

API = "https://api.github.com"
TOKEN = os.environ.get("PLANETBINTANG_READ_TOKEN") or os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
SENSITIVE_SEGMENT = re.compile(
    r"(^|[._-])(secret|secrets|credential|credentials|token|tokens|password|passwd|private|"
    r"key|keys|pem|cert|certificate|ssl|ssh|id_rsa|env|dotenv|backup|dump)([._/-]|$)",
    re.IGNORECASE,
)
MAX_TREE_FALLBACK_CALLS = 4500
MAX_TREE_ENTRIES = 5000000
RUN_CANDIDATES = {
    "package.json": "Node.js package/entry metadata",
    "index.html": "Browser HTML entry candidate",
    "main.py": "Python entry candidate",
    "app.py": "Python application candidate",
    "server.py": "Python server candidate",
    "manage.py": "Django management candidate",
    "pyproject.toml": "Python project metadata",
    "requirements.txt": "Python dependency manifest",
    "index.php": "PHP web entry candidate",
    "artisan": "Laravel CLI candidate",
    "composer.json": "PHP package metadata",
    "main.tf": "Terraform configuration candidate",
    "Dockerfile": "Container build candidate",
    "docker-compose.yml": "Container orchestration candidate",
    "docker-compose.yaml": "Container orchestration candidate",
    "go.mod": "Go module metadata",
    "Cargo.toml": "Rust package metadata",
    "Makefile": "Build task candidate",
}


def _api_get(path: str, params: dict | None = None):
    url = API + path
    if params:
        url += "?" + urlencode(params)
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "planetbintang-static-tree-index",
    }
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers=headers), timeout=35) as response:
                return json.loads(response.read().decode("utf-8")), response.status
        except HTTPError as exc:
            if exc.code == 403 and exc.headers.get("X-RateLimit-Remaining") == "0" and attempt < 2:
                try:
                    wait = max(1, int(exc.headers.get("X-RateLimit-Reset", "0")) - int(time.time()))
                except ValueError:
                    wait = 3
                time.sleep(min(wait, 60))
                continue
            return None, exc.code
        except (URLError, TimeoutError, OSError, json.JSONDecodeError):
            if attempt < 2:
                time.sleep(1 + attempt)
                continue
            return None, 0
    return None, 0


def _safe_path(path: str) -> bool:
    parts = path.split("/")
    return bool(path) and all(part not in ("", ".", "..", ".git") and not SENSITIVE_SEGMENT.search(part) for part in parts)


def _entry(path: str, item: dict) -> dict:
    raw_type = item.get("type")
    entry_type = "directory" if raw_type == "tree" else "submodule" if raw_type == "commit" else "file"
    try:
        size = int(item.get("size") or 0)
    except (TypeError, ValueError):
        size = 0
    return {
        "path": path,
        "type": entry_type,
        "sha": str(item.get("sha") or ""),
        "mode": str(item.get("mode") or ""),
        "size": size,
        "sizeKnown": raw_type != "blob" or item.get("size") is not None,
    }


def _empty_result(root_tree_sha: str = "") -> dict:
    return {
        "state": "empty", "treeSha": root_tree_sha, "entries": [],
        "entryCount": 0, "fileCount": 0, "directoryCount": 0,
        "submoduleCount": 0, "totalBytes": 0, "executableFileCount": 0,
        "sizeUnknownCount": 0, "redactedCount": 0, "fallbackUsed": False, "gitFallbackUsed": False,
    }


def _git_blobless_tree(full_name: str, branch: str, root_tree_sha: str, expected_head_sha: str, existing: dict[str, dict]):
    """Enumerate trees with partial clone; --no-checkout and blob:none avoid source contents."""
    if not branch:
        return None
    url = f"https://github.com/{full_name}.git"
    try:
        with tempfile.TemporaryDirectory(prefix="pb-tree-") as temp_dir:
            env = os.environ.copy()
            # Git reads this transient auth header from its environment; it is
            # never written to the snapshot, command line, or log output.
            if TOKEN:
                auth = base64.b64encode(("x-access-token:" + TOKEN).encode("utf-8")).decode("ascii")
                env["GIT_CONFIG_COUNT"] = "1"
                env["GIT_CONFIG_KEY_0"] = "http.https://github.com/.extraheader"
                env["GIT_CONFIG_VALUE_0"] = "AUTHORIZATION: basic " + auth
            clone = subprocess.run(
                ["git", "clone", "--filter=blob:none", "--no-checkout", "--depth=1", "--single-branch", "--branch", branch, url, temp_dir],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env, timeout=420, check=False,
            )
            if clone.returncode != 0:
                return None
            head = subprocess.run(["git", "-C", temp_dir, "rev-parse", "HEAD"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=30, check=False)
            tree = subprocess.run(["git", "-C", temp_dir, "rev-parse", "HEAD^{tree}"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=30, check=False)
            if head.returncode != 0 or tree.returncode != 0:
                return None
            if expected_head_sha and head.stdout.strip() != expected_head_sha:
                return None
            if tree.stdout.strip() != root_tree_sha:
                return None
            listing = subprocess.run(
                ["git", "-C", temp_dir, "ls-tree", "-r", "-t", "-z", "--full-tree", "HEAD"],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=900, check=False,
            )
            if listing.returncode != 0:
                return None
            recovered: dict[str, dict] = {}
            redacted = 0
            for record in listing.stdout.split(b"\0"):
                if not record:
                    continue
                try:
                    meta, raw_path = record.split(b"\t", 1)
                    mode, raw_type, sha = meta.decode("ascii").split(" ", 2)
                    path = raw_path.decode("utf-8", "replace")
                except (ValueError, UnicodeDecodeError):
                    continue
                if not _safe_path(path):
                    redacted += 1
                    continue
                old = existing.get(path, {})
                entry_type = "directory" if raw_type == "tree" else "submodule" if raw_type == "commit" else "file"
                recovered[path] = {
                    "path": path,
                    "type": entry_type,
                    "sha": sha,
                    "mode": mode,
                    "size": int(old.get("size") or 0),
                    "sizeKnown": bool(old.get("sizeKnown", entry_type != "file")),
                }
            if not recovered:
                return None
            return {"entries": recovered, "redactedCount": redacted, "headSha": head.stdout.strip(), "treeSha": tree.stdout.strip()}
    except (OSError, subprocess.TimeoutExpired):
        return None


def scan_tree(full_name: str, root_tree_sha: str, branch: str = "", expected_head_sha: str = "") -> dict:
    """Return a Git tree snapshot, using blobless partial clone if REST is truncated."""
    if not root_tree_sha:
        return _empty_result()
    repo = quote(full_name, safe="/")
    root_sha = quote(root_tree_sha, safe="")
    data, status = _api_get(f"/repos/{repo}/git/trees/{root_sha}", {"recursive": "1"})
    if status != 200 or not isinstance(data, dict):
        return {
            "state": "unavailable", "treeSha": root_tree_sha, "entries": [],
            "entryCount": 0, "fileCount": 0, "directoryCount": 0,
            "submoduleCount": 0, "totalBytes": 0, "executableFileCount": 0,
            "redactedCount": 0, "fallbackUsed": False, "httpStatus": status,
        }

    raw_entries = data.get("tree") if isinstance(data.get("tree"), list) else []
    redacted = 0
    fallback_used = bool(data.get("truncated"))
    complete = True
    normalized: dict[str, dict] = {}

    if not fallback_used:
        for item in raw_entries:
            path = str(item.get("path") or "")
            if not _safe_path(path):
                redacted += 1
                continue
            normalized[path] = _entry(path, item)
    else:
        # The recursive API caps response size. Walk each directory tree without
        # recursion to recover all names while keeping the scope per repo.
        queue = deque([("", root_tree_sha)])
        calls = 0
        while queue:
            if calls >= MAX_TREE_FALLBACK_CALLS or len(normalized) >= MAX_TREE_ENTRIES:
                complete = False
                break
            prefix, tree_sha = queue.popleft()
            tree_data, tree_status = _api_get(f"/repos/{repo}/git/trees/{quote(tree_sha, safe='')}")
            calls += 1
            if tree_status != 200 or not isinstance(tree_data, dict) or not isinstance(tree_data.get("tree"), list):
                complete = False
                continue
            if tree_data.get("truncated"):
                complete = False
            for item in tree_data["tree"]:
                name = str(item.get("path") or "")
                path = f"{prefix}/{name}" if prefix else name
                if not _safe_path(path):
                    redacted += 1
                    continue
                normalized[path] = _entry(path, item)
                if item.get("type") == "tree":
                    queue.append((path, str(item.get("sha") or "")))
                if len(normalized) >= MAX_TREE_ENTRIES:
                    complete = False
                    break

    git_fallback_used = False
    if not complete:
        recovered = _git_blobless_tree(full_name, branch, root_tree_sha, expected_head_sha, normalized)
        if recovered:
            normalized = recovered["entries"]
            redacted = recovered["redactedCount"]
            complete = True
            git_fallback_used = True
    entries = sorted(normalized.values(), key=lambda entry: (entry["path"].casefold(), entry["path"]))
    files = [entry for entry in entries if entry["type"] == "file"]
    directories = [entry for entry in entries if entry["type"] == "directory"]
    submodules = [entry for entry in entries if entry["type"] == "submodule"]
    state = "complete" if complete else "partial"
    return {
        "state": state,
        "treeSha": str(data.get("sha") or root_tree_sha),
        "entries": entries,
        "entryCount": len(entries),
        "fileCount": len(files),
        "directoryCount": len(directories),
        "submoduleCount": len(submodules),
        "totalBytes": sum(entry["size"] for entry in files),
        "executableFileCount": sum(entry["mode"] == "100755" for entry in files),
        "sizeUnknownCount": sum(not entry.get("sizeKnown", True) for entry in files),
        "redactedCount": redacted,
        "fallbackUsed": fallback_used,
        "gitFallbackUsed": git_fallback_used,
    }


def static_assessment(tree: dict, languages: list[dict] | None = None) -> dict:
    entries = tree.get("entries", [])
    candidates = []
    executable = []
    for entry in entries:
        if entry.get("type") != "file":
            continue
        basename = entry["path"].rsplit("/", 1)[-1]
        label = RUN_CANDIDATES.get(basename)
        if label:
            candidates.append({"path": entry["path"], "label": label, "sha": entry.get("sha", "")})
        if entry.get("mode") == "100755":
            executable.append(entry["path"])
    integrity = {
        "complete": "tree-complete",
        "partial": "tree-partial",
        "empty": "tree-empty",
    }.get(tree.get("state"), "tree-unavailable")
    return {
        "mode": "static-metadata-only",
        "integrityCoverage": integrity,
        "codeExecution": "not-executed",
        "fileCount": tree.get("fileCount", 0),
        "treeSha": tree.get("treeSha", ""),
        "executableFileCount": tree.get("executableFileCount", 0),
        "sizeUnknownCount": tree.get("sizeUnknownCount", 0),
        "executablePaths": executable[:50],
        "runnableCandidates": candidates[:80],
        "languages": [item.get("name", "") for item in (languages or [])],
        "note": "Struktur dan hash Git saja; bukan audit keamanan atau bukti bahwa kode aman dijalankan.",
    }
