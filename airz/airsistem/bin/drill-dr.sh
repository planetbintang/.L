#!/bin/sh
# Air Cloud maintenance script: drill-dr.sh
set -eu
echo "[airz] menjalankan drill-dr.sh ..."
airzctl status --all | grep -E 'degraded|failed' || echo "[airz] semua komponen sehat"
exit 0
