#!/bin/sh
# Air Cloud maintenance script: rotate-keys.sh
set -eu
echo "[airz] menjalankan rotate-keys.sh ..."
airzctl status --all | grep -E 'degraded|failed' || echo "[airz] semua komponen sehat"
exit 0
