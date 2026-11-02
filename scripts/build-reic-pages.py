#!/usr/bin/env python3
"""Build browser pages from canonical .reic documents for GitHub Pages.

REIC files in this repository currently use HTML-compatible document markup.
This build step publishes a matching .html artifact beside each source file,
without modifying or deleting the canonical .reic source.
"""
from __future__ import annotations

import argparse
from pathlib import Path
import sys


def reic_sources(root: Path):
    for source in root.rglob("*.reic"):
        if ".git" in source.parts or not source.is_file():
            continue
        yield source


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true",
                        help="verify that every REIC source has a generated HTML page")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    sources = sorted(reic_sources(root))
    if not sources:
        print("FAIL: no .reic source files found", file=sys.stderr)
        return 1

    missing: list[str] = []
    generated = 0
    for source in sources:
        relative = source.relative_to(root)
        target = source.with_suffix(".html")
        if args.check:
            if not target.is_file():
                missing.append(relative.as_posix())
            continue

        # Keep paths inside the repository and preserve the original source.
        resolved_target = target.resolve()
        if root not in resolved_target.parents:
            print(f"FAIL: output path escapes repository: {relative}", file=sys.stderr)
            return 1
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(source.read_bytes())
        generated += 1

    if missing:
        print("FAIL: generated HTML pages are missing for:", file=sys.stderr)
        for path in missing[:100]:
            print(f" - {path}", file=sys.stderr)
        print(f"Total missing: {len(missing)}", file=sys.stderr)
        return 1

    if not (root / "index.html").is_file():
        print("FAIL: root index.html is missing", file=sys.stderr)
        return 1

    if args.check:
        print(f"REIC integrity OK: {len(sources)} source files have HTML counterparts.")
    else:
        print(f"REIC build OK: generated {generated} HTML pages from {len(sources)} sources.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
