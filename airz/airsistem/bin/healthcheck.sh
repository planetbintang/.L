#!/bin/sh
# Air Cloud maintenance script: healthcheck.sh
set -eu
echo "[airz] menjalankan healthcheck.sh ..."
airzctl status --all | grep -E 'degraded|failed' || echo "[airz] semua komponen sehat"
exit 0
