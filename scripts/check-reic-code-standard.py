#!/usr/bin/env python3
"""Read-only quality report for VMDESKTOPREIC source files.

The checker deliberately does not pad generated or minified files. It reports
line targets and validates the files that participate in the browser runtime.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POLICY = ROOT / "vmdesktopreic" / "core-code-policy.json"


def is_generated(path: str, roots: list[str]) -> bool:
    normalized = path.replace("\\", "/")
    return any(normalized.startswith(root) for root in roots)


def code_files(root: Path, extensions: list[str]):
    for path in root.rglob("*"):
        if path.is_file() and path.suffix.lower() in extensions:
            yield path


def run_node_check(path: Path) -> tuple[bool, str]:
    result = subprocess.run(["node", "--check", str(path)], capture_output=True, text=True)
    return result.returncode == 0, (result.stderr or result.stdout).strip()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="print machine-readable report")
    parser.add_argument("--strict", action="store_true", help="fail when a core entry point is below the line target")
    args = parser.parse_args()

    policy = json.loads(POLICY.read_text(encoding="utf-8"))
    root = ROOT / "vmdesktopreic"
    rows = []
    syntax_failures = []
    empty_files = []
    target_failures = []

    for path in code_files(root, policy["codeExtensions"]):
        relative = path.relative_to(root).as_posix()
        text = path.read_text(encoding="utf-8", errors="replace")
        lines = len(text.splitlines())
        generated = is_generated(relative, policy["generatedRoots"])
        row = {"path": relative, "lines": lines, "generated": generated, "status": "ok"}
        if not text.strip():
            row["status"] = "empty"
            empty_files.append(relative)
        if path.suffix.lower() == ".js" and not generated:
            ok, detail = run_node_check(path)
            if not ok:
                row["status"] = "syntax-error"
                row["detail"] = detail
                syntax_failures.append(relative)
        if relative in policy["coreEntryPoints"] and lines < policy["lineTarget"]:
            row["lineTarget"] = "advisory" if not args.strict else "fail"
            target_failures.append(relative)
        rows.append(row)

    report = {
        "schemaVersion": 1,
        "scope": "vmdesktopreic",
        "totalCodeFiles": len(rows),
        "generatedCodeFiles": sum(row["generated"] for row in rows),
        "emptyFiles": empty_files,
        "syntaxFailures": syntax_failures,
        "coreBelowLineTarget": target_failures,
        "lineTarget": policy["lineTarget"],
        "paddingApplied": False,
        "status": "fail" if empty_files or syntax_failures or (args.strict and target_failures) else "pass",
    }
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(f"REIC code files: {report['totalCodeFiles']}")
        print(f"Generated code files: {report['generatedCodeFiles']}")
        print(f"Empty files: {len(empty_files)}")
        print(f"JavaScript syntax failures: {len(syntax_failures)}")
        print(f"Core files below advisory target: {len(target_failures)}")
        print(f"Padding applied: no")
        print(f"Status: {report['status'].upper()}")
    return 1 if report["status"] == "fail" else 0


if __name__ == "__main__":
    sys.exit(main())
