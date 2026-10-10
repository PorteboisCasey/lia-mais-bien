#!/usr/bin/env bash
# Régénère assets/og.png (image de partage, 1200 × 630) depuis tools/og.html. Exige Chrome et une connexion.
set -e
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-prefers-reduced-motion \
  --allow-file-access-from-files --virtual-time-budget=5000 --window-size=1200,630 \
  --screenshot="$PWD/assets/og.png" "file://$PWD/tools/og.html" 2>/dev/null
echo "✓ assets/og.png ($(wc -c < assets/og.png | tr -d ' ') octets)"
