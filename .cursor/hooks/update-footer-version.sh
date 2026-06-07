#!/bin/bash
# Update footer build version to v1.YYMMDD (today's date) on each agent session.
set -euo pipefail

FOOTER="src/components/pages/footer/Footer.tsx"
DATE=$(date +%y%m%d)
VERSION="v1.${DATE}"

if [[ ! -f "$FOOTER" ]]; then
  exit 0
fi

if grep -q 'v1\.[0-9]\{6\}' "$FOOTER"; then
  sed -i '' "s/v1\.[0-9]\{6\}/${VERSION}/" "$FOOTER"
fi

exit 0
