#!/bin/bash
# Update footer build version to v1.YYMMDD (today's date).
# Idempotent: skips if already updated today (stamp file).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FOOTER="${ROOT}/src/components/pages/footer/Footer.tsx"
STAMP="${ROOT}/.cursor/.footer-version-stamp"
DATE=$(date +%y%m%d)
VERSION="v1.${DATE}"

if [[ -f "$STAMP" ]] && [[ "$(cat "$STAMP")" == "$DATE" ]]; then
  exit 0
fi

if [[ ! -f "$FOOTER" ]]; then
  exit 0
fi

if grep -q 'v1\.[0-9]\{6\}' "$FOOTER"; then
  sed -i '' "s/v1\.[0-9]\{6\}/${VERSION}/" "$FOOTER"
  echo "$DATE" > "$STAMP"
fi

exit 0
