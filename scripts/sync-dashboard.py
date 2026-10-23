#!/usr/bin/env python3
"""Create a safe, static metadata and Git-tree snapshot for the public dashboard.

Repository paths and Git object metadata are indexed recursively, with sensitive
path segments omitted. Blob contents, credentials, collaborator identities and
visitor-level data are never requested or published; repository code is not run.
"""
from __future__ import annotations

import hashlib
import ipaddress
import json
import os
import re
import socket
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode, urlparse
from urllib.request import Request, urlopen
from tree_index import scan_tree, static_assessment
from tree_publish import publish_tree_shards

ROOT = Path(__file__).resolve().parents[1]
SCOPE_PATH = ROOT / "data" / "repository-scope.json"
OUTPUT_PATH = ROOT / "data" / "repositories.json"
API = "https://api.github.com"
TOKEN = os.environ.get("PLANETBINTANG_READ_TOKEN") or os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
OWNER = "planetbintang"

# Hide paths that could expose secrets, credentials, private key material or
# environment files. No file contents are fetched.
SENSITIVE_NAME = re.compile(
    r"(^|[._-])(secret|secrets|credential|credentials|token|tokens|password|passwd|private|"
    r"key|keys|pem|cert|certificate|ssl|ssh|id_rsa|env|dotenv|backup|dump)([._/-]|$)", re.IGNORECASE,
)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def api_get(path: str, params: dict | None = None):
    url = API + path
    if params:
        url += "?" + urlencode(params)
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "planetbintang-public-system-dashboard",
    }
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    for attempt in range(3):
        try:
            req = Request(url, headers=headers)
            with urlopen(req, timeout=25) as response:
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


def safe_root_listing(repo: str, branch: str):
    data, status = api_get(f"/repos/{repo}/contents", {"ref": branch})
    if not isinstance(data, list):
        return [], status
    entries = []
    for item in data:
        name = str(item.get("name", ""))
        if not name or name == ".git" or SENSITIVE_NAME.search(name):
            continue
        entries.append({
            "name": name[:160],
            "type": "folder" if item.get("type") == "dir" else "file",
            "size": int(item.get("size") or 0),
        })
    entries.sort(key=lambda item: (item["type"] != "folder", item["name"].casefold()))
    return entries[:60], status


def classify_app(entries: list[dict], languages: dict[str, int], empty: bool) -> str:
    if empty:
        return "Repository kosong"
    names = {item["name"].casefold() for item in entries}
    langs = {name.casefold() for name in languages}
    if "main.tf" in names or "terraform" in langs:
        return "Infrastruktur · Terraform"
    if "php" in langs or any(name.endswith(".php") for name in names):
        return "Aplikasi web · PHP/backend"
    if "index.html" in names or "html" in langs:
        if "python" in langs:
            return "Workspace web · HTML + Python"
        return "Antarmuka web · statis"
    if "python" in langs:
        return "Sistem · Python/tooling"
    if "javascript" in langs or "typescript" in langs:
        return "Aplikasi · JavaScript/TypeScript"
    if names <= {"readme", "readme.md", "readme.txt", "license", "license.md"}:
        return "Dokumentasi"
    return "Data / aset sistem"


def traffic(repo: str, endpoint: str):
    data, status = api_get(f"/repos/{repo}/traffic/{endpoint}")
    if status != 200 or not isinstance(data, dict):
        return None
    if endpoint == "views":
        return {"count": int(data.get("count", 0)), "uniques": int(data.get("uniques", 0))}
    return {"count": int(data.get("count", 0)), "uniqueCloners": int(data.get("unique_clones", data.get("uniqueCloners", 0)))}


def inspect_repo(full_name: str) -> dict:
    repo = quote(full_name, safe="/")
    meta, status = api_get(f"/repos/{repo}")
    if status != 200 or not isinstance(meta, dict):
        return {
            "name": full_name.rsplit("/", 1)[-1], "fullName": full_name,
            "url": f"https://github.com/{full_name}", "state": "unavailable",
            "visibility": "unknown", "branch": "", "pagesEnabled": False,
            "pagesUrl": "", "domain": "", "host": "github.com", "ipAddresses": [],
            "headSha": "", "lastCommitAt": "", "appType": "Metadata tidak tersedia",
            "languages": [], "rootItems": [], "rootItemCount": 0,
            "tree": {"state": "unavailable", "treeSha": "", "entries": [], "entryCount": 0, "fileCount": 0, "directoryCount": 0, "submoduleCount": 0, "totalBytes": 0, "executableFileCount": 0, "sizeUnknownCount": 0, "redactedCount": 0, "fallbackUsed": False, "gitFallbackUsed": False},
            "staticAssessment": {"mode": "static-metadata-only", "integrityCoverage": "tree-unavailable", "codeExecution": "not-executed", "runnableCandidates": [], "note": "Struktur saja; bukan audit keamanan."},
            "traffic14d": None, "metadataStatus": status,
        }

    branch = meta.get("default_branch") or ""
    is_private = bool(meta.get("private"))
    visibility = "private" if is_private else "public"
    if not branch:
        root_items, root_status, commit, languages = [], 409, None, {}
    else:
        root_items, root_status = safe_root_listing(full_name, branch)
        commit, _ = api_get(f"/repos/{repo}/commits/{quote(branch, safe='')}")
        languages, _ = api_get(f"/repos/{repo}/languages")
        if not isinstance(languages, dict):
            languages = {}

    pages_enabled = bool(meta.get("has_pages"))
    pages, _ = api_get(f"/repos/{repo}/pages") if pages_enabled else (None, 404)
    pages_url = (pages or {}).get("html_url", "") if isinstance(pages, dict) else ""
    homepage = (meta.get("homepage") or "").strip()
    deployment_url = pages_url or homepage
    parsed = urlparse(deployment_url) if deployment_url else None
    host = (parsed.hostname or "") if parsed else ""
    head_sha = (commit or {}).get("sha", "") if isinstance(commit, dict) else ""
    commit_body = (commit or {}).get("commit", {}) if isinstance(commit, dict) else {}
    commit_meta = commit_body.get("author") or commit_body.get("committer") or {}
    last_commit_at = commit_meta.get("date", "")
    is_empty = (not branch) or root_status == 409 or (int(meta.get("size") or 0) == 0 and not root_items)

    views = traffic(full_name, "views")
    clones = traffic(full_name, "clones")
    traffic_data = None
    if views is not None or clones is not None:
        traffic_data = {
            "views": views,
            "clones": clones,
            "windowDays": 14,
            "source": "GitHub repository traffic API; aggregate only",
        }

    language_items = sorted(
        [{"name": key, "bytes": int(value)} for key, value in languages.items()],
        key=lambda item: (-item["bytes"], item["name"].casefold()),
    )[:5]
    root_tree_sha = str((commit_body.get("tree") or {}).get("sha") or "")
    tree_snapshot = scan_tree(full_name, root_tree_sha, branch, head_sha) if root_tree_sha else {
        "state": "empty" if is_empty else "unavailable", "treeSha": "", "entries": [],
        "entryCount": 0, "fileCount": 0, "directoryCount": 0, "submoduleCount": 0,
        "totalBytes": 0, "executableFileCount": 0, "sizeUnknownCount": 0, "redactedCount": 0,
        "fallbackUsed": False, "gitFallbackUsed": False,
    }
    static_review = static_assessment(tree_snapshot, language_items)
    state = "empty" if is_empty else "available"
    return {
        "name": meta.get("name", full_name.rsplit("/", 1)[-1]),
        "fullName": meta.get("full_name", full_name),
        "url": meta.get("html_url", f"https://github.com/{full_name}"),
        "state": state,
        "visibility": visibility,
        "branch": branch,
        "pagesEnabled": pages_enabled,
        "pagesUrl": pages_url,
        "homepage": homepage,
        "domain": parsed.hostname if parsed else "",
        "host": host or "github.com",
        "ipAddresses": [],
        "headSha": head_sha,
        "lastCommitAt": last_commit_at,
        "appType": classify_app(root_items, languages, is_empty),
        "languages": language_items,
        "rootPath": ".",
        "rootItems": root_items,
        "rootItemCount": len(root_items),
        "tree": tree_snapshot,
        "staticAssessment": static_review,
        "traffic14d": traffic_data,
        "members": {"published": False, "note": "Identitas anggota hanya tersedia setelah login ke GitHub."},
    }


def resolve_public_addresses(host: str) -> list[str]:
    if not host:
        return []
    addresses = set()
    try:
        for result in socket.getaddrinfo(host, None, type=socket.SOCK_STREAM):
            address = result[4][0].split("%", 1)[0]
            try:
                if ipaddress.ip_address(address).is_global:
                    addresses.add(address)
            except ValueError:
                continue
    except OSError:
        pass
    return sorted(addresses, key=lambda value: (":" in value, value))


def main() -> int:
    if not TOKEN:
        print("::notice::Snapshot tidak diubah. Tambahkan secret PLANETBINTANG_READ_TOKEN untuk sinkronisasi repo privat.")
        return 0
    if not SCOPE_PATH.exists():
        print(f"Missing fixed repository scope: {SCOPE_PATH}", file=sys.stderr)
        return 2
    scope = json.loads(SCOPE_PATH.read_text(encoding="utf-8"))
    if not isinstance(scope, list) or not all(isinstance(item, str) for item in scope):
        print("Repository scope must be a JSON array of full_name strings.", file=sys.stderr)
        return 2

    repositories = [None] * len(scope)
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(inspect_repo, name): index for index, name in enumerate(scope)}
        for future in as_completed(futures):
            index = futures[future]
            try:
                repositories[index] = future.result()
            except Exception as exc:  # Preserve other repository results if one item fails.
                name = scope[index]
                repositories[index] = {
                    "name": name.rsplit("/", 1)[-1], "fullName": name,
                    "url": f"https://github.com/{name}", "state": "error",
                    "visibility": "unknown", "branch": "", "pagesEnabled": False,
                    "pagesUrl": "", "homepage": "", "domain": "", "host": "github.com",
                    "ipAddresses": [], "headSha": "", "lastCommitAt": "",
                    "appType": "Metadata sementara gagal dimuat", "languages": [],
                    "rootPath": ".", "rootItems": [], "rootItemCount": 0,
                    "tree": {"state": "unavailable", "treeSha": "", "entries": [], "entryCount": 0, "fileCount": 0, "directoryCount": 0, "submoduleCount": 0, "totalBytes": 0, "executableFileCount": 0, "sizeUnknownCount": 0, "redactedCount": 0, "fallbackUsed": False, "gitFallbackUsed": False},
                    "staticAssessment": {"mode": "static-metadata-only", "integrityCoverage": "tree-unavailable", "codeExecution": "not-executed", "runnableCandidates": [], "note": "Struktur saja; bukan audit keamanan."},
                    "traffic14d": None, "members": {"published": False},
                    "errorType": type(exc).__name__,
                }

    all_hosts = {"github.com", "api.github.com", "planetbintang.github.io"}
    for item in repositories:
        if item.get("host"):
            all_hosts.add(item["host"])
        if item.get("domain"):
            all_hosts.add(item["domain"])
    dns_checked_at = utc_now()
    domain_map = {
        host: {"addresses": resolve_public_addresses(host), "checkedAt": dns_checked_at}
        for host in sorted(all_hosts)
    }
    for item in repositories:
        item["ipAddresses"] = domain_map.get(item.get("host", ""), {}).get("addresses", [])

    tree_stats = publish_tree_shards(repositories, ROOT / "data" / "trees")
    now = utc_now()
    public_count = sum(item.get("visibility") == "public" for item in repositories)
    private_count = sum(item.get("visibility") == "private" for item in repositories)
    payload = {
        "schemaVersion": 2,
        "root": ".",
        "connector": {
            "label": ".",
            "owner": OWNER,
            "source": "GitHub REST API snapshot",
            "sync": "GitHub Actions; daily when PLANETBINTANG_READ_TOKEN is configured",
        },
        "updatedAt": now,
        "repositoryCount": len(repositories),
        "publicCount": public_count,
        "privateCount": private_count,
        "pagesEnabledCount": sum(bool(item.get("pagesEnabled")) for item in repositories),
        "fileTreeIndex": {
            "repositoryCount": tree_stats["repositories"],
            "visiblePathCount": tree_stats["entries"],
            "directoryPageCount": tree_stats["pages"],
            "pageSize": 500,
            "loading": "lazy per directory; path, Git SHA, mode and size only",
        },
        "dnsCheckedAt": dns_checked_at,
        "domainMap": domain_map,
        "privacy": {
            "repositoryNamesPublic": True,
            "fileTree": "Recursive Git paths, modes, object SHAs and sizes; sensitive path segments filtered; no blob contents.",
            "codeExecution": False,
            "assessment": "Static structural metadata only; not a security audit and not proof code is safe to run.",
            "memberIdentitiesPublished": False,
            "visitorLevelTracking": False,
            "traffic": "Aggregate GitHub repository views/clones only; 14-day window when available.",
        },
        "repositories": repositories,
    }
    canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    payload["dataSha256"] = hashlib.sha256(canonical).hexdigest()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated public snapshot: {len(repositories)} repositories; {public_count} public; {private_count} private; {payload['pagesEnabledCount']} Pages-enabled.")
    print(f"Git tree index: {tree_stats['entries']} visible paths in {tree_stats['pages']} lazy directory pages; main snapshot excludes file entries.")
    print(f"Snapshot SHA-256: {payload['dataSha256']}")
    print("Git tree paths/SHA/modes/sizes indexed where accessible; no repository blob contents or code execution.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
