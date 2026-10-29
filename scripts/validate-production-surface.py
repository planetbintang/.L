#!/usr/bin/env python3
"""Fail the Pages build when core production-workspace assets are incomplete."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors = []

def require(condition, message):
    if not condition:
        errors.append(message)

data_path = ROOT / "data/git-feature-catalog.json"
try:
    catalog = json.loads(data_path.read_text(encoding="utf-8"))
except Exception as exc:
    print(f"FAIL: cannot parse {data_path}: {exc}", file=sys.stderr)
    raise SystemExit(1)

features = catalog.get("features", [])
modules = catalog.get("modules", [])
require(catalog.get("count") == 1500, "catalog count must be 1500")
require(len(features) == 1500, f"expected 1500 features, got {len(features)}")
require(len(modules) == 30, f"expected 30 modules, got {len(modules)}")
ids = [item.get("id") for item in features]
require(all(isinstance(value, str) and value for value in ids), "every feature needs a non-empty string id")
require(len(ids) == len(set(ids)), "feature ids must be unique")
indices = [item.get("index") for item in features]
require(len(indices) == len(set(indices)), "feature indexes must be unique")
module_names = {item.get("name") for item in modules}
allowed_statuses = {"planned", "in-review", "implemented", "verified"}
for item in features:
    for field in ("id", "title", "module", "action", "status"):
        require(bool(item.get(field)), f"feature {item.get('id', '<unknown>')} is missing {field}")
    require(item.get("module") in module_names, f"feature {item.get('id')} references unknown module")
    require(item.get("status") in allowed_statuses, f"feature {item.get('id')} has invalid status")

required_files = [
    "index.html",
    "git-feature-catalog.html",
    "git-feature-catalog.js",
    "feature-workbench.html",
    "github-operations.html",
]
for relative in required_files:
    require((ROOT / relative).is_file(), f"required page/file missing: {relative}")

def read(relative):
    path = ROOT / relative
    return path.read_text(encoding="utf-8") if path.is_file() else ""

catalog_html = read("git-feature-catalog.html")
catalog_js = read("git-feature-catalog.js")
homepage = read("index.html")
ops = read("github-operations.html")
require("./github-operations.html" in catalog_html, "feature catalog must link to GitHub Operations")
require("./feature-workbench.html?feature=" in catalog_js, "feature detail must link to implementation workbench")
require("./github-operations.html" in catalog_js, "feature detail must link to GitHub Operations")
require("./github-operations.html" in homepage, "homepage must link to GitHub Operations")
require("https://api.github.com" in ops, "GitHub Operations must use the actual GitHub REST API")
require("localStorage" not in ops, "GitHub token/data must not be persisted in browser storage by this page")
require("Authorization" in ops and "Bearer " in ops, "authenticated requests must use the Authorization header")
require("method:'POST'" in ops and "/issues" in ops, "issue creation endpoint must be present")

if errors:
    print("Production surface validation failed:")
    for error in errors:
        print(f" - {error}")
    raise SystemExit(1)
print(f"Production surface validation passed: {len(features)} unique feature specifications, {len(modules)} modules, and all operational pages/links present.")
