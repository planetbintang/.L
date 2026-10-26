#!/usr/bin/env python3
"""Ekstraksi FITUR NYATA airz/ → data/airz-features.js (window.PB_AIRZ_FEATURES).

Membaca pohon fisik `airz/airsistem` (ratusan folder · puluhan ribu file) dan
mengubahnya menjadi katalog fitur konsol Air Cloud:

  * domains     — kategori layanan (compute, network, security, ...) yang
                  dipetakan ke menu utama registry Air Cloud (group_slug).
  * items       — seluruh FILE sistem sebagai fitur fungsional dengan path,
                  fungsi, ukuran, isi contoh (potongan kecil), dan domain.
  * bins        — script executable di airz/airsistem/bin (airzctl, backup...).
  * docs        — dokumentasi per domain dari airz/airsistem/docs/<slug>.md.
  * api         — ringkasan openapi.json + gateway.yaml.
  * regions / services / modules — inventaris runtime nyata.

Konsol browser (air-cloud-console.js) memakai katalog ini untuk menampilkan
"seluruh fitur airz/" pada menu Air Cloud beserta tombol fungsinya.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AIRZ = ROOT / "airz"
SYSTEM = AIRZ / "airsistem"
OUT = ROOT / "data" / "airz-features.js"

MAX_ITEMS = 26000          # seluruh file tetap masuk, dibatasi agar JS wajar
SNIPPET_LIMIT = 260        # cuplikan isi disimpan terpisah (lazy) — hemat bobot berkas
SNIPPET_CHARS = 480

# Domain folder fisik → group_slug menu Air Cloud yang menaunginya
DOMAIN_TO_SLUG = {
    "compute": ["compute"],
    "virtualservers": ["compute"],
    "cluster": ["containers-kubernetes", "compute"],
    "containers": ["containers-kubernetes"],
    "network": ["vpc-infrastructure"],
    "zones": ["vpc-infrastructure"],
    "regions": ["datacenter-regions"],
    "storage": ["storage"],
    "database": ["database"],
    "cache": ["storage"],
    "images": ["compute"],
    "snapshots": ["disaster-recovery"],
    "backup": ["disaster-recovery"],
    "dr": ["disaster-recovery"],
    "security": ["security-compliance"],
    "keys": ["security-compliance"],
    "certificates": ["security-compliance"],
    "compliance": ["security-compliance"],
    "audit": ["security-compliance"],
    "iam": ["iam-access"],
    "ai": ["ai-ml"],
    "ml": ["ai-ml"],
    "quantum": ["quantum-computing"],
    "blockchain": ["blockchain"],
    "iot": ["iot-device"],
    "games": ["game-cloud"],
    "media": ["media-content"],
    "marketplace": ["marketplace-partners"],
    "billing": ["billing-account"],
    "quotas": ["billing-account"],
    "tags": ["billing-account"],
    "support": ["support-tickets"],
    "alerts": ["monitoring-observability"],
    "metrics": ["monitoring-observability"],
    "logs": ["monitoring-observability"],
    "monitoring": ["monitoring-observability"],
    "jobs": ["serverless-functions"],
    "webhooks": ["developer-tools"],
    "sdk": ["developer-tools"],
    "terraform": ["devops-toolchain"],
    "modules": ["devops-toolchain"],
    "provision": ["migration-hybrid"],
    "templates": ["migration-hybrid"],
    "sustainability": ["sustainability"],
    "api": ["developer-tools"],
    "docs": ["developer-tools"],
    "etc": ["compute"],
    "bin": ["developer-tools"],
    "manifest": ["developer-tools"],
    "registry": ["developer-tools"],
    "featureflags": ["devops-toolchain"],
}


def norm(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def slug_for_domain(domain: str) -> str:
    candidates = DOMAIN_TO_SLUG.get(domain, [])
    return candidates[0] if candidates else ""


def snippet_of(path: Path) -> str:
    try:
        with path.open("r", encoding="utf-8", errors="ignore") as handle:
            text = handle.read(SNIPPET_CHARS * 2)
    except OSError:
        return ""
    text = re.sub(r"\x00", "", text)
    return text[:SNIPPET_CHARS]


def function_from_content(name: str, text: str) -> str:
    for line in text.splitlines():
        line = line.strip("# \t/*\"'")
        if len(line) > 12 and ("Air Cloud" in line or "airz" in line.lower()):
            return line[:160]
    return f"Berkas sistem {name}"


def main() -> None:
    items: list[dict] = []
    domains: dict[str, dict] = {}
    bins: list[dict] = []
    docs: dict[str, str] = {}
    snippets: dict[str, str] = {}
    snippets_used: set[str] = set()

    if not SYSTEM.exists():
        raise SystemExit(f"pohon sistem tidak ditemukan: {SYSTEM}")

    for path in sorted(SYSTEM.rglob("*")):
        rel = path.relative_to(SYSTEM).as_posix()
        top = rel.split("/", 1)[0]
        domain = norm(top) if top.isascii() else top
        if path.is_dir():
            info = domains.setdefault(domain, {"domain": domain, "title": top, "folders": 0, "files": 0})
            info["folders"] += 1
            continue
        info = domains.setdefault(domain, {"domain": domain, "title": top, "folders": 0, "files": 0})
        info["files"] += 1
        if len(items) < MAX_ITEMS:
            size = path.stat().st_size
            want_snippet = len(snippets_used) < SNIPPET_LIMIT and size <= 65536
            text = snippet_of(path) if want_snippet else ""
            if text:
                snippets_used.add(rel)
            row = {
                "id": f"AZ-{norm(rel)[:52]}",
                "path": f"airz/airsistem/{rel}",
                "name": path.name,
                "domain": domain,
                "menu_slug": slug_for_domain(domain),
                "size": size,
                "kind": "script" if path.suffix == ".sh" or path.name.startswith(("airz-", "airz")) and path.parent.name == "bin" else "file",
                "function": function_from_content(path.name, text),
            }
            if text:
                snippets[rel] = text
            items.append(row)
            if path.parent.name == "bin":
                bins.append({"name": path.name, "path": row["path"], "function": row["function"], "snippet": text[:240] or snippets.get(rel, "")[:240]})

    docs_dir = SYSTEM / "docs"
    if docs_dir.exists():
        for doc in sorted(docs_dir.glob("*.md")):
            docs[norm(doc.stem)] = doc.read_text(encoding="utf-8", errors="ignore")[:14000]

    api_summary = {}
    openapi = SYSTEM / "api" / "openapi.json"
    if openapi.exists():
        try:
            payload = json.loads(openapi.read_text(encoding="utf-8"))
            paths = payload.get("paths") or {}
            api_summary = {
                "title": (payload.get("info") or {}).get("title", "Air Cloud API"),
                "version": (payload.get("info") or {}).get("version", ""),
                "endpointCount": len(paths),
                "endpoints": [
                    {"method": (list(ops.keys())[0] if ops else "get").upper(), "path": p,
                     "summary": (next(iter(ops.values()), {}) or {}).get("summary", "")}
                    for p, ops in list(paths.items())[:400]
                ],
            }
        except (json.JSONDecodeError, OSError):
            pass

    def count_prefix(prefix: str) -> int:
        target = SYSTEM / prefix
        return sum(1 for p in target.rglob("*") if p.is_file()) if target.exists() else 0

    domain_list = sorted(domains.values(), key=lambda d: -d["files"])
    for dom in domain_list:
        dom["menu_slug"] = slug_for_domain(dom["domain"])

    payload = {
        "version": "2026.10",
        "source": "scripts/build_airz_features.py",
        "root": "airz/",
        "systemRoot": "airz/airsistem",
        "totals": {
            "domains": len(domain_list),
            "files": len(items),
            "folders": sum(d["folders"] for d in domain_list),
            "bins": len(bins),
            "docs": len(docs),
            "apiEndpoints": api_summary.get("endpointCount", 0),
        },
        "domains": domain_list,
        "items": items,
        "bins": bins,
        "docs": docs,
        "snippets": snippets,
        "api": api_summary,
    }
    header = (
        "// Dihasilkan scripts/build_airz_features.py — katalog fitur nyata folder airz/.\n"
        "// Konsol Air Cloud (air-cloud-console.js) memakai window.PB_AIRZ_FEATURES untuk\n"
        "// menampilkan seluruh fitur, dokumen, API, bin, dan komponen sistem airz/airsistem.\n"
    )
    OUT.write_text(header + "window.PB_AIRZ_FEATURES = "
                   + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n",
                   encoding="utf-8")
    print(f"airz-features.js: {OUT.stat().st_size // 1024} KB · "
          f"{len(items)} fitur · {len(domain_list)} domain · {len(bins)} bin · {len(docs)} dokumen")


if __name__ == "__main__":
    main()
