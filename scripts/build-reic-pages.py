#!/usr/bin/env python3
"""Build browser pages from canonical .reic documents for GitHub Pages.

REIC files in this repository use HTML-compatible document markup. This build
publishes a matching .html artifact beside each source, preserves the .reic
source, skips identical outputs, and streams the repository walk to limit
memory use on large REIC trees.
"""
from __future__ import annotations

import argparse
import os
from pathlib import Path
import sys


def reic_sources(root: Path):
    """Yield REIC files without traversing Git's internal object directory."""
    for directory, dirs, files in os.walk(root):
        dirs[:] = [name for name in dirs if name != ".git"]
        for name in files:
            if name.endswith(".reic"):
                source = Path(directory) / name
                if source.is_file():
                    yield source


def files_match(source: Path, target: Path) -> bool:
    """Compare files byte-for-byte without loading large assets into memory."""
    if not target.is_file() or source.stat().st_size != target.stat().st_size:
        return False
    with source.open("rb") as left, target.open("rb") as right:
        while True:
            left_chunk = left.read(1024 * 1024)
            right_chunk = right.read(1024 * 1024)
            if left_chunk != right_chunk:
                return False
            if not left_chunk:
                return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true",
                        help="verify that every REIC source has a byte-identical HTML page")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    source_count = 0
    missing_count = 0
    stale_count = 0
    missing_examples: list[str] = []
    stale_examples: list[str] = []
    generated = 0
    unchanged = 0

    for source in reic_sources(root):
        source_count += 1
        relative = source.relative_to(root)
        target = source.with_suffix(".html")

        # Reject output paths redirected outside the repository by symlinks.
        resolved_target = target.resolve()
        if root not in resolved_target.parents:
            print(f"FAIL: output path escapes repository: {relative}", file=sys.stderr)
            return 1

        if args.check:
            if not target.is_file():
                missing_count += 1
                if len(missing_examples) < 100:
                    missing_examples.append(relative.as_posix())
            elif not files_match(source, target):
                stale_count += 1
                if len(stale_examples) < 100:
                    stale_examples.append(relative.as_posix())
            continue

        if files_match(source, target):
            unchanged += 1
            continue

        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(source.read_bytes())
        generated += 1

    if source_count == 0:
        print("FAIL: no .reic source files found", file=sys.stderr)
        return 1

    if missing_count or stale_count:
        if missing_count:
            print("FAIL: generated HTML pages are missing for:", file=sys.stderr)
            for path in missing_examples:
                print(f" - {path}", file=sys.stderr)
            print(f"Total missing: {missing_count}", file=sys.stderr)
        if stale_count:
            print("FAIL: generated HTML pages differ from their REIC sources:", file=sys.stderr)
            for path in stale_examples:
                print(f" - {path}", file=sys.stderr)
            print(f"Total stale: {stale_count}", file=sys.stderr)
        return 1

    if not (root / "index.html").is_file():
        print("FAIL: root index.html is missing", file=sys.stderr)
        return 1

    if args.check:
        print(f"REIC integrity OK: {source_count} source files have byte-identical HTML counterparts.")
    else:
        print(f"REIC build OK: generated {generated} HTML pages; left {unchanged} identical pages untouched from {source_count} sources.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
