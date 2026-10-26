#!/bin/sh
# Air Cloud maintenance script: report-carbon.sh
set -eu
echo "[airz] menjalankan report-carbon.sh ..."
airzctl status --all | grep -E 'degraded|failed' || echo "[airz] semua komponen sehat"
exit 0
