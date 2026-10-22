#!/usr/bin/env python3
"""Local read-only desktop bridge for the current repository workspace."""
from __future__ import annotations

import json
import mimetypes
import os
import subprocess
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

ROOT = Path(__file__).resolve().parent
MAX_FILE_BYTES = 400_000


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
