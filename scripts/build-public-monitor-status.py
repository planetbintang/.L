#!/usr/bin/env python3
"""Build a privacy-minimal snapshot freshness document for the public monitor."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / "data/repositories.json"
output = ROOT / "monitoring/snapshot-status.json"

payload = json.loads(source.read_text(encoding="utf-8"))
source_updated_at = payload.get("updatedAt")
if not isinstance(source_updated_at, str) or not source_updated_at:
    raise SystemExit("data/repositories.json must provide a non-empty updatedAt value")
try:
    parsed = datetime.fromisoformat(source_updated_at.replace("Z", "+00:00"))
except ValueError as exc:
    raise SystemExit(f"invalid source updatedAt: {exc}") from exc
if parsed.tzinfo is None:
    raise SystemExit("source updatedAt must include a timezone")

status = {
    "schemaVersion": 1,
    "sourceSnapshotUpdatedAt": source_updated_at,
    "statusGeneratedAt": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
}
output.write_text(json.dumps(status, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Wrote metadata-only snapshot status; source snapshot updated at {source_updated_at}.")
