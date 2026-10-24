#!/usr/bin/env python3
"""Materialize the Planetbintang virtual feature registry as physical files.

The dashboard uses the same deterministic naming contract in file-manager.js.
Physical materialization is opt-in so the repository is not bloated by default.
"""
from __future__ import annotations

import argparse
from pathlib import Path

DOMAINS = [
    "access", "analytics", "api", "app", "automation", "backup",
    "brand", "code", "community", "content", "data", "design",
    "device", "docs", "execute", "files", "forms", "graph",
    "integration", "management", "monitoring", "pipeline", "security", "workspace",
]
EXTENSIONS = ("html", "css", "js", "nz")
DEFAULT_BUCKETS = 384
DEFAULT_PER_BUCKET = 32


def feature_body(domain: str, extension: str, index: int) -> str:
    feature = f"feature_{index:05d}"
    if extension == "html":
        return (
            f'<!-- Planetbintang feature {feature} -->\n'
            f'<article data-feature="{feature}" data-domain="{domain}">\n'
            f'  <header><h2>{domain} feature {index}</h2></header>\n'
            '  <section data-slot="content"></section>\n'
            '</article>\n'
        )
    if extension == "css":
        return (
            f"/* Feature {feature} · {domain} */\n"
            f'[data-feature="{feature}"] {{\n'
            "  display: grid;\n  gap: 12px;\n  contain: content;\n}\n"
        )
    if extension == "js":
        return (
            f"// Feature {feature} · {domain}\n"
            f"export function run_{feature}(context = {{}}) {{\n"
            f"  return {{ feature: '{feature}', domain: '{domain}', status: 'ready', context }};\n"
            "}\n"
        )
    return (
        f"# Planetbintang feature {feature}\n"
        f"domain = {domain}\nfeature_id = {feature}\n"
        "status = ready\nexecution = disabled-by-default\n"
    )


def iter_features(bucket_count: int, per_bucket: int):
    for bucket in range(bucket_count):
        bucket_name = f"f{bucket:03d}"
        for offset in range(per_bucket):
            index = bucket * per_bucket + offset
            domain = DOMAINS[index % len(DOMAINS)]
            extension = EXTENSIONS[index % len(EXTENSIONS)]
            name = f"{domain}-feature-{index:05d}.{extension}"
            yield bucket_name, name, feature_body(domain, extension, index)


def main() -> int:
    parser = argparse.ArgumentParser(description="Materialize virtual Planetbintang feature files")
    parser.add_argument("--output", type=Path, default=Path("generated/system-features"))
    parser.add_argument("--buckets", type=int, default=DEFAULT_BUCKETS)
    parser.add_argument("--per-bucket", type=int, default=DEFAULT_PER_BUCKET)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    if args.buckets < 1 or args.per_bucket < 1:
        parser.error("--buckets dan --per-bucket harus lebih besar dari nol")
    total = args.buckets * args.per_bucket
    if args.dry_run:
        print(f"would materialize {total} feature files under {args.output}")
        return 0
    written = 0
    for bucket, name, content in iter_features(args.buckets, args.per_bucket):
        target = args.output / bucket / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        written += 1
    print(f"materialized {written} feature files under {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
