#!/usr/bin/env python3
"""Local read-only desktop bridge for the current repository workspace."""
from __future__ import annotations

import json
import mimetypes
import os
import re
import subprocess
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

ROOT = Path(__file__).resolve().parent
MAX_FILE_BYTES = 400_000
SNAPS_REGISTRY = ROOT / "mcp-registry.json"


def snaps_registry() -> dict:
    try:
        return json.loads(SNAPS_REGISTRY.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"connectors": []}


def env_token(connector_id: str) -> str:
    """Token kustom per konektor dari environment variable.

    Contoh: PLANETBINTANG_SNAPS_GIT_GITHUB_TOKEN, PLANETBINTANG_SNAPS_AI_GOOGLE_AISTUDIO_TOKEN
    """
    name = "PLANETBINTANG_SNAPS_" + connector_id.upper().replace("-", "_") + "_TOKEN"
    return os.environ.get(name, "")


def http_json(url: str, headers: dict | None = None, timeout: int = 15) -> tuple[int, bytes]:
    request = urllib.request.Request(url, headers={"User-Agent": "Planetbintang-SNAPS/1.0", **(headers or {})})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read()


def snaps_status() -> dict:
    registry = snaps_registry()
    connectors = []
    for item in registry.get("connectors", []):
        token = env_token(item["id"])
        connectors.append({
            "id": item["id"],
            "title": item.get("title"),
            "kind": item.get("kind"),
            "endpoint": item.get("endpoint"),
            "tokenFromEnv": bool(token),
            "tokenMasked": (token[:4] + "•" * min(12, max(4, len(token) - 4))) if token else None,
        })
    return {
        "brand": "PLANETBINTANG",
        "anchor": ["logo", "wordmark", "folder-icon"],
        "role": "SNAPS permanen sistem I/O — MCP/git connector hub, pusat kode, pembuat aplikasi, korpus RAG",
        "registryVersion": registry.get("version"),
        "connectors": connectors,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }


def snaps_probe(connector_id: str) -> dict:
    token = env_token(connector_id)
    try:
        if connector_id == "git-github":
            url = "https://api.github.com/user" if token else "https://api.github.com/zen"
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            status, body = http_json(url, headers)
            ok = status == 200
            detail = "Terautentikasi via env token." if (ok and token) else ("Mode publik (tanpa env token)." if ok else f"HTTP {status}")
            return {"connector": connector_id, "ok": ok, "status": status, "detail": detail}
        if connector_id == "ai-google-aistudio":
            if not token:
                return {"connector": connector_id, "ok": False, "status": None, "detail": "Set PLANETBINTANG_SNAPS_AI_GOOGLE_AISTUDIO_TOKEN (API key dari https://aistudio.google.com/apikey)."}
            status, body = http_json(f"https://generativelanguage.googleapis.com/v1beta/models?key={urllib.parse.quote_plus(token)}")
            models = json.loads(body).get("models", []) if status == 200 else []
            return {"connector": connector_id, "ok": status == 200, "status": status, "detail": f"{len(models)} model tersedia." if status == 200 else body[:200].decode("utf-8", "replace")}
        if connector_id == "rag-archive-org":
            status, body = http_json("https://archive.org/metadata/torahbiblicalte00grin")
            return {"connector": connector_id, "ok": status == 200, "status": status, "detail": "Metadata item contoh dimuat." if status == 200 else f"HTTP {status}"}
        if connector_id == "rag-perpusnas":
            status, _body = http_json("https://catalog.perpusnas.go.id/")
            ok = status == 200
            return {"connector": connector_id, "ok": ok, "status": status, "detail": "Katalog Perpusnas terjangkau dari jembatan server-side." if ok else f"Perpusnas menjawab HTTP {status}; coba endpoint pencarian /snaps/rag/perpusnas?q=..."}
        if connector_id == "rag-libraryofcongress":
            status, _body = http_json("https://www.loc.gov/search/?q=indonesia&fo=json&c=1")
            return {"connector": connector_id, "ok": status == 200, "status": status, "detail": "Search API LoC merespons JSON." if status == 200 else f"HTTP {status}"}
        if connector_id in ("git-gitlab", "git-bitbucket"):
            base = "https://gitlab.com/api/v4/projects?per_page=1" if connector_id == "git-gitlab" else "https://api.bitbucket.org/2.0/user"
            headers = {"PRIVATE-TOKEN": token} if (connector_id == "git-gitlab" and token) else ({"Authorization": f"Bearer {token}"} if token else {})
            status, _body = http_json(base, headers)
            return {"connector": connector_id, "ok": status == 200, "status": status, "detail": "Terhubung." if status == 200 else f"HTTP {status}"}
    except OSError as exc:
        return {"connector": connector_id, "ok": False, "status": None, "detail": f"Jaringan: {exc}"}
    return {"connector": connector_id, "ok": False, "status": None, "detail": "Konektor tidak dikenal."}


def snaps_rag_perpusnas(query: str) -> dict:
    """Proksi server-side katalog Perpusnas (menghindari blokir CORS browser).

    Endpoint INLIS katalog publik; jika host menolak (403 anti-bot), hasil
    dikembalikan dengan panduan fallback ke sumber arsip lain.
    """
    encoded = urllib.parse.quote(query)
    urls = [
        f"https://catalog.perpusnas.go.id/Command/search.php?op=Search&IndexMode=Keyword&LocalBranchCodes=INLIS_NEW&PageOffset=0&searchTerm={encoded}&outputFormat=marc21xml",
        f"https://www.perpusnas.go.id/en/search?q={encoded}",
    ]
    last_status = None
    for url in urls:
        try:
            status, body = http_json(url, {"Accept": "application/xml,text/html,*/*"}, timeout=20)
        except OSError:
            continue
        last_status = status
        if status != 200:
            continue
        text = body.decode("utf-8", "replace")
        results: list[dict] = []
        for title in re.findall(r"<subfield code=\"a\">([^<]{3,160})</subfield>", text)[:20]:
            results.append({"title": title.strip(), "author": "", "url": url})
        if not results:
            for title in re.findall(r"<title>([^<]{3,160})</title>", text)[:10]:
                if "perpusnas" in title.lower() or "library" in title.lower():
                    continue
                results.append({"title": title.strip(), "author": "", "url": url})
        if results:
            return {"source": "perpusnas", "query": query, "results": results}
    return {
        "source": "perpusnas",
        "query": query,
        "results": [],
        "note": f"Katalog Perpusnas menjawab HTTP {last_status} atau tidak mengembalikan entri yang dapat diurai. Gunakan jembatan untuk mencoba ulang, atau impor dari Internet Archive / Library of Congress sebagai alternatif korpus RAG.",
    }


def git(*args: str) -> str:
    try:
        result = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, timeout=4)
        return result.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        return ""


def remote_visibility(remote: str) -> str:
    if "github.com" not in remote:
        return "LOCAL / TIDAK DIKETAHUI"
    slug = remote.split("github.com", 1)[1].lstrip(":/").removesuffix(".git")
    try:
        result = subprocess.run(["gh", "repo", "view", slug, "--json", "isPrivate", "--jq", ".isPrivate"], cwd=ROOT, capture_output=True, text=True, timeout=5)
        if result.returncode == 0 and result.stdout.strip() == "true":
            return "PRIVAT / GITHUB"
        if result.returncode == 0 and result.stdout.strip() == "false":
            return "PUBLIK / GITHUB"
    except (OSError, subprocess.SubprocessError):
        pass
    return "GITHUB / TERHUBUNG"


def safe_path(relative: str) -> Path:
    candidate = (ROOT / unquote(relative or "")).resolve()
    try:
        candidate.relative_to(ROOT)
    except ValueError as exc:
        raise PermissionError("Path keluar dari workspace") from exc
    return candidate


def repo_metadata() -> dict:
    remote = git("config", "--get", "remote.origin.url") or "Belum terhubung"
    branch = git("branch", "--show-current") or "detached"
    status_lines = [line for line in git("status", "--short").splitlines() if line.strip()]
    visibility = remote_visibility(remote)
    remote_slug = remote.split("github.com", 1)[1].lstrip(":/").removesuffix(".git") if "github.com" in remote else "planetbintang/.L"
    return {
        "name": remote_slug or "planetbintang/.L",
        "root": str(ROOT),
        "remote": remote,
        "branch": branch,
        "visibility": visibility,
        "modified": len(status_lines),
        "tracked": len(git("ls-files").splitlines()),
    }


def workspace_index() -> dict:
    entries: list[dict] = []
    folders: set[str] = set()
    total_size = 0
    system_count = 0
    for path in ROOT.rglob("*"):
        if ".git" in path.relative_to(ROOT).parts or not path.is_file():
            continue
        relative = path.relative_to(ROOT).as_posix()
        stat = path.stat()
        total_size += stat.st_size
        hidden = any(part.startswith(".") for part in Path(relative).parts)
        if hidden:
            system_count += 1
        parent = Path(relative).parent
        while str(parent) not in ("", "."):
            folders.add(parent.as_posix())
            parent = parent.parent
        entries.append({
            "path": relative,
            "name": path.name,
            "kind": "system" if hidden else "file",
            "extension": path.suffix.lower().lstrip("."),
            "size": stat.st_size,
            "modified": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
            "mime": mimetypes.guess_type(path.name)[0] or "application/octet-stream",
        })
    entries.sort(key=lambda item: item["path"].lower())
    return {
        "root": str(ROOT),
        "entries": entries[:10000],
        "files": len(entries),
        "folders": len(folders),
        "bytes": total_size,
        "system": system_count,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "git": repo_metadata(),
    }


class DesktopHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        print(f"[desktop] {self.address_string()} - {fmt % args}")

    def send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/snaps/status":
            self.send_json(snaps_status())
            return
        if parsed.path.startswith("/snaps/probe/"):
            connector_id = unquote(parsed.path.rsplit("/", 1)[-1])
            self.send_json(snaps_probe(connector_id))
            return
        if parsed.path == "/snaps/rag/perpusnas":
            query = parse_qs(parsed.query).get("q", [""])[0]
            if not query:
                self.send_json({"error": "Parameter q wajib diisi"}, 400)
                return
            self.send_json(snaps_rag_perpusnas(query))
            return
        if parsed.path == "/api/repository":
            self.send_json(repo_metadata())
            return
        if parsed.path == "/api/index":
            self.send_json(workspace_index())
            return
        if parsed.path == "/api/file":
            relative = parse_qs(parsed.query).get("path", [""])[0]
            try:
                path = safe_path(relative)
                if not path.is_file():
                    self.send_json({"error": "File tidak ditemukan"}, 404)
                    return
                if path.stat().st_size > MAX_FILE_BYTES:
                    self.send_json({"error": "File terlalu besar untuk preview", "size": path.stat().st_size}, 413)
                    return
                content = path.read_text(encoding="utf-8", errors="replace")
                self.send_json({"path": relative, "content": content, "size": path.stat().st_size})
            except (PermissionError, OSError) as exc:
                self.send_json({"error": str(exc)}, 403)
            return
        super().do_GET()

    def do_POST(self) -> None:
        if urlparse(self.path).path == "/api/index":
            self.send_json(workspace_index())
            return
        self.send_json({"error": "Endpoint tidak tersedia"}, 404)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "4173"))
    print(f"Desktop workspace aktif di http://127.0.0.1:{port}")
    print(f"Filesystem root read-only: {ROOT}")
    ThreadingHTTPServer(("127.0.0.1", port), DesktopHandler).serve_forever()
