#!/usr/bin/env bash
set -Eeuo pipefail

DOMAIN="${DOMAIN:-planetbintang.com}"
WWW="www.${DOMAIN}"
EXPECTED_A=(185.199.108.153 185.199.109.153 185.199.110.153 185.199.111.153)
failed=0

if ! command -v dig >/dev/null 2>&1; then
  echo "ERROR: dig is required (install dnsutils/bind-tools)." >&2
  exit 2
fi
if ! command -v curl >/dev/null 2>&1; then
  echo "ERROR: curl is required." >&2
  exit 2
fi

echo "== Apex A records: $DOMAIN =="
actual_a="$(dig +short A "$DOMAIN" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | sort -u || true)"
printf '%s\n' "${actual_a:-<none>}"
for ip in "${EXPECTED_A[@]}"; do
  if ! grep -Fxq "$ip" <<<"$actual_a"; then
    echo "MISSING A record: $ip"
    failed=1
  fi
done

echo
echo "== www CNAME: $WWW =="
actual_cname="$(dig +short CNAME "$WWW" | sed 's/\.$//' | tr '[:upper:]' '[:lower:]' | tail -n 1)"
echo "${actual_cname:-<none>}"
if [[ "$actual_cname" != "planetbintang.github.io" ]]; then
  echo "ERROR: expected www CNAME -> planetbintang.github.io"
  failed=1
fi

echo
for url in "https://$DOMAIN/" "https://$WWW/"; do
  echo "== HTTP(S): $url =="
  if curl --silent --show-error --location --max-time 20 --output /dev/null --write-out 'HTTP %{http_code}; final URL %{url_effective}; TLS verify %{ssl_verify_result}\n' "$url"; then
    code="$(curl --silent --location --max-time 20 --output /dev/null --write-out '%{http_code}' "$url" || true)"
    if [[ ! "$code" =~ ^2[0-9][0-9]$ ]]; then
      echo "WARNING: final response is not 2xx (HTTP $code). Check Pages settings, certificate, and redirects."
      failed=1
    fi
  else
    echo "ERROR: request failed. DNS, Pages custom domain, or TLS certificate may not be ready."
    failed=1
  fi
done

if (( failed )); then
  echo
  echo "RESULT: checks failed or are incomplete. This script does not change DNS or GitHub Pages settings."
  exit 1
fi
echo
echo "RESULT: DNS and HTTPS checks passed. Confirm the custom domain is saved in GitHub Settings > Pages."
