#!/bin/sh
# Air Cloud maintenance script: audit-collect.sh
set -eu
echo "[airz] menjalankan audit-collect.sh ..."
airzctl status --all | grep -E 'degraded|failed' || echo "[airz] semua komponen sehat"
exit 0
