#!/usr/bin/env python3
"""Validate the public route monitor and its static Pages outputs."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


def load_json(relative: str):
    path = ROOT / relative
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"cannot parse {relative}: {exc}")
        return None


def html_output_for(target_path: str) -> Path:
    output = ROOT / target_path
    return output / "index.html" if target_path.endswith("/") else output


def reic_source_for(output: Path) -> Path:
    return output.with_suffix(".reic")


parser = argparse.ArgumentParser()
parser.add_argument("--require-output", action="store_true",
                    help="require published index.html outputs, as in the Pages build")
args = parser.parse_args()

target_doc = load_json("monitoring/targets.json") or {}
targets = target_doc.get("targets", [])
require(target_doc.get("schemaVersion") == 1, "monitoring targets schemaVersion must be 1")
require(isinstance(targets, list) and bool(targets), "monitoring targets must be a non-empty array")
ids: list[str] = []
paths: list[str] = []
for target in targets:
    if not isinstance(target, dict):
        errors.append("each target must be an object")
        continue
    target_id = target.get("id")
    path = target.get("path")
    require(isinstance(target_id, str) and bool(target_id), "every target needs a non-empty id")
    require(isinstance(path, str) and bool(path), f"target {target_id!r} needs a path")
    if not isinstance(path, str) or not path:
        continue
    require(not path.startswith("/"), f"target path must be relative: {path}")
    require("\\" not in path and not any(part in {".", ".."} for part in path.split("/")),
            f"target path must stay inside the site root: {path}")
    require("://" not in path and "?" not in path and "#" not in path,
            f"target path must be a static same-origin path: {path}")
    ids.append(target_id)
    paths.append(path)
    output = html_output_for(path)
    source = reic_source_for(output)
    if args.require_output:
        require(output.is_file(), f"published output missing for target {path}")
    elif path.endswith("/"):
        require(output.is_file() or source.is_file(), f"HTML/REIC source missing for target {path}")
    elif path.endswith(".html"):
        require(output.is_file() or source.is_file(), f"HTML/REIC source missing for target {path}")
    else:
        require(output.is_file(), f"file target missing: {path}")

require(len(ids) == len(set(ids)), "target ids must be unique")
require(len(paths) == len(set(paths)), "target paths must be unique")

for relative in (
    "monitoring/index.html",
    "monitoring/monitoring.css",
    "monitoring/monitoring.js",
    "monitoring/snapshot-status.json",
    "monitoring/README.md",
):
    require((ROOT / relative).is_file(), f"monitoring asset missing: {relative}")

html = (ROOT / "monitoring/index.html").read_text(encoding="utf-8")
script = (ROOT / "monitoring/monitoring.js").read_text(encoding="utf-8")
snapshot_status = load_json("monitoring/snapshot-status.json") or {}
require("./monitoring.css" in html and "./monitoring.js" in html,
        "monitor page must load its separated CSS and JavaScript")
require("./monitoring/" in (ROOT / "index.html").read_text(encoding="utf-8"),
        "root navigation must link to ./monitoring/")
require("credentials: 'omit'" in script and "mode: 'same-origin'" in script,
        "monitor probes must omit credentials and remain same-origin")
require("redirect: 'manual'" in script and "redirect: 'follow'" not in script,
        "monitor probes must not follow redirects outside the Pages subpath")
require("setInterval" in script and "visibilityState" in script,
        "monitor must poll and respect tab visibility")
require("monitoring/snapshot-status.json" in script,
        "monitor must read the reduced snapshot status, not the raw inventory")
require(not any("data/repositories.json" in path for path in paths),
        "public route table must not link the raw repository inventory")
require(isinstance(snapshot_status, dict) and set(snapshot_status) == {
    "schemaVersion", "sourceSnapshotUpdatedAt", "statusGeneratedAt"
}, "public snapshot status must contain only schema and timestamp metadata")
require(snapshot_status.get("schemaVersion") == 1 and
        isinstance(snapshot_status.get("sourceSnapshotUpdatedAt"), str),
        "public snapshot status schema/timestamp is invalid")

routes = load_json("manus-routes.json") or {}
require(any(item.get("path") == "/monitoring/" for item in routes.get("routes", []) if isinstance(item, dict)),
        "manus-routes.json must declare /monitoring/")
registry = load_json("data/system-registry.json") or {}
monitor_route = next((item for item in registry.get("routes", [])
                     if isinstance(item, dict) and item.get("id") == "monitoring"), None)
require(monitor_route is not None, "system registry must declare monitoring")
if monitor_route:
    require(monitor_route.get("route") == "./monitoring/", "monitor registry route must point to ./monitoring/")
    require("no-backend" in monitor_route.get("executionState", ""),
            "monitor registry must not claim backend monitoring")
sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
require("https://planetbintang.github.io/.L/monitoring/" in sitemap,
        "sitemap must include the monitoring page")
media_source = (ROOT / "media/index.reic").read_text(encoding="utf-8")
require('href="../data/repositories.json"' not in media_source and
        'href="./repositories/index.json"' not in media_source and
        'href="./planetbintang-system.json"' not in media_source,
        "Media Root must withhold raw repository manifest links pending privacy review")
if (ROOT / "media/index.html").is_file():
    require((ROOT / "media/index.reic").read_bytes() == (ROOT / "media/index.html").read_bytes(),
            "Media Root HTML must match its canonical REIC source")

if args.require_output:
    for relative in (
        "media/index.reic",
        "pusat-pengembangan/index.reic",
        "vendordomain/enterprise/index.reic",
        "git-feature-catalog.reic",
        "feature-workbench.reic",
        "github-operations.reic",
    ):
        source_path = ROOT / relative
        target_path = source_path.with_suffix(".html")
        require(source_path.is_file() and target_path.is_file(),
                f"REIC route output missing: {relative}")
        if source_path.is_file() and target_path.is_file():
            require(source_path.read_bytes() == target_path.read_bytes(),
                    f"REIC output differs from canonical source: {relative}")

if errors:
    print("Live monitor validation failed:", file=sys.stderr)
    for message in errors:
        print(f" - {message}", file=sys.stderr)
    raise SystemExit(1)
print(f"Live monitor validation passed: {len(targets)} routes; output check={args.require_output}.")
