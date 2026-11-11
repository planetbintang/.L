#!/usr/bin/env python3
"""Audit the repository-wide REIC 10,000-line source standard.

Read-only by design: never pads files or overwrites component source. Every
.reic component is expected to have sibling .reicss and .reicjs modules.
"""
from __future__ import annotations
import argparse, json, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = 10000
SKIP = {".git", "node_modules", ".venv", "__pycache__", ".next", "dist", "build"}

def files():
    for p in ROOT.rglob("*.reic"):
        if not any(part in SKIP for part in p.relative_to(ROOT).parts):
            yield p

def lines(p: Path) -> int:
    return len(p.read_text(encoding="utf-8", errors="replace").splitlines())

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--strict", action="store_true")
    args = ap.parse_args()
    rows, missing, below, syntax = [], [], [], []
    source_files = 0
    for component in sorted(files()):
        rel = component.relative_to(ROOT)
        css, js = component.with_suffix(".reicss"), component.with_suffix(".reicjs")
        source_files += 1
        item = {"component": rel.as_posix(), "lines": lines(component), "companions": {}}
        if item["lines"] < TARGET:
            below.append({"path": rel.as_posix(), "lines": item["lines"], "kind": "reic"})
        for kind, path in (("reicss", css), ("reicjs", js)):
            if not path.is_file():
                missing.append(path.relative_to(ROOT).as_posix())
                item["companions"][kind] = {"exists": False, "lines": 0}
                continue
            count = lines(path)
            item["companions"][kind] = {"exists": True, "lines": count}
            if count < TARGET:
                below.append({"path": path.relative_to(ROOT).as_posix(), "lines": count, "kind": kind})
            if kind == "reicjs":
                check = subprocess.run(["node", "--check", str(path)], capture_output=True, text=True)
                if check.returncode:
                    syntax.append({"path": path.relative_to(ROOT).as_posix(),
                                   "detail": (check.stderr or check.stdout).strip()[:1200]})
        rows.append(item)
    report = {
        "schemaVersion": 2, "scope": ".L/ seluruh repositori",
        "lineTarget": TARGET, "componentCount": len(rows),
        "expectedSourceFiles": len(rows) * 3,
        "belowTarget": below, "missingCompanions": missing,
        "javascriptSyntaxFailures": syntax, "components": rows,
        "paddingApplied": False,
        "meaningfulCodeRequired": True,
        "filesAtTarget": source_files * 3 - len(below) - len(missing),
        "status": "pass" if not below and not missing and not syntax else "needs-work"
    }
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(f"Komponen .reic: {len(rows)}")
        print(f"Target: {TARGET} baris kode bermakna per .reic/.reicss/.reicjs")
        print(f"File sumber yang dipindai: {source_files * 3}")
        print(f"File di bawah target: {len(below)}")
        print(f"Pasangan hilang: {len(missing)}")
        print(f"Kesalahan sintaks .reicjs: {len(syntax)}")
        print("Padding otomatis: tidak")
        print(f"Status audit: {report['status'].upper()}")
    return 1 if args.strict and report["status"] != "pass" else 0

if __name__ == "__main__":
    raise SystemExit(main())
