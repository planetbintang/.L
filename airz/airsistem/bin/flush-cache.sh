#!/bin/sh
# Air Cloud maintenance script: flush-cache.sh
set -eu
echo "[airz] menjalankan flush-cache.sh ..."
airzctl status --all | grep -E 'degraded|failed' || echo "[airz] semua komponen sehat"
exit 0
