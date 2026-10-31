#!/usr/bin/env python3
"""Validate every VendorDomain menu route and generated feature page in Pages output."""
from __future__ import annotations

import json
import sys
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
VD = ROOT / "vendordomain"
MANIFEST = ROOT / "scripts" / "html-reic-migration-manifest.txt"
errors: list[str] = []

def require(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)

def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except Exception as exc:
        errors.append(f"cannot read {path.relative_to(ROOT)}: {exc}")
        return ""

require((VD / "index.html").is_file(), "VendorDomain entrypoint vendordomain/index.html is missing")
require(MANIFEST.is_file(), "REIC migration manifest is missing")

manifest_paths = set()
if MANIFEST.is_file():
    manifest_paths = {
        line.strip() for line in MANIFEST.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    }

registry_path = VD / "features" / "index.json"
try:
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
except Exception as exc:
    registry = {}
    errors.append(f"VendorDomain feature registry is invalid: {exc}")

features = registry.get("features", []) if isinstance(registry, dict) else []
require(registry.get("featureCount") == 500, "VendorDomain registry featureCount must be 500")
require(len(features) == 500, f"VendorDomain registry must contain 500 features, found {len(features)}")

seen = set()
for feature in features:
    feature_id = feature.get("id")
    detail = feature.get("detailPath")
    require(isinstance(feature_id, int), f"feature has invalid id: {feature!r}")
    require(isinstance(detail, str) and bool(detail), f"feature {feature_id} has invalid detailPath")
    if not isinstance(detail, str) or not detail:
        continue

    # Older entries may point directly to a .reic file in ../pages/,
    # while newer entries use a directory containing index.reic.
    detail_path = PurePosixPath(detail)
    source_candidate = PurePosixPath("vendordomain/features") / detail_path
    normalized = PurePosixPath()
    parts = []
    for part in source_candidate.parts:
        if part in ("", "."):
            continue
        if part == "..":
            if not parts:
                errors.append(f"feature {feature_id} escapes repository root: {detail}")
                break
            parts.pop()
        else:
            parts.append(part)
    else:
        source_rel = PurePosixPath(*parts).as_posix()
        if detail_path.suffix.lower() == ".reic":
            output_rel = str(PurePosixPath(source_rel).with_suffix(".html"))
        else:
            output_rel = str(PurePosixPath(source_rel) / "index.html")
            source_rel = str(PurePosixPath(source_rel) / "index.reic")

        require(source_rel in manifest_paths, f"feature {feature_id} source is not included in Pages conversion manifest: {source_rel}")
        output = ROOT / output_rel
        require(output.is_file(), f"feature {feature_id} deployment page is missing: {output_rel}")
        if detail in seen:
            errors.append(f"duplicate VendorDomain detailPath: {detail}")
        seen.add(detail)

# Direct routes opened by the top navigation and the workspace click handler.
required_routes = (
    "enterprise/index.html",
    "features/index.html",
    "cms/index.html",
    "vendor-reseller/index.html",
    "url-routing/index.html",
    "config/layout/pengguna-tim-akses/index.html",
)
for route in required_routes:
    require((VD / route).is_file(), f"VendorDomain menu route is missing from Pages output: vendordomain/{route}")

for source_rel in ("vendordomain/enterprise/index.reic", "vendordomain/features/index.reic"):
    require(source_rel in manifest_paths, f"required VendorDomain REIC page is not in conversion manifest: {source_rel}")

workspace = read_text(VD / "index.html")
for route in required_routes:
    require(route in workspace, f"VendorDomain workspace does not declare expected menu route: {route}")

enterprise_html = read_text(VD / "enterprise" / "index.html")
require('id="settingsQuick"' in enterprise_html, "Enterprise settings anchor #settingsQuick is missing")

# Feature detail pages load these shared runtime files relative to /features/pages/feature-NNN/.
for asset in ("api-config.js", "feature-runtime.js"):
    require((VD / "features" / asset).is_file(), f"VendorDomain feature runtime asset is missing: vendordomain/features/{asset}")

if errors:
    print("VendorDomain deployment validation failed:")
    for error in errors:
        print(f" - {error}")
    raise SystemExit(1)

print(
    f"VendorDomain deployment validation passed: {len(features)} feature pages, "
    f"{len(seen)} unique detail routes, and {len(required_routes)} direct menu routes."
)
