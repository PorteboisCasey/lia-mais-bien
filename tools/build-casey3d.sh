#!/usr/bin/env bash
# Construit ateliers/casey3d.min.js : casey3d.js + la partie de Three.js qu'il utilise, en un seul fichier minifié,
# hébergé avec le site (une seule requête, pas de détour par un CDN). À relancer après chaque modification de casey3d.js.
# Usage : bash tools/build-casey3d.sh   (exige Node ; three et esbuild sont installés dans un dossier temporaire, rien dans le dépôt)
set -euo pipefail
cd "$(dirname "$0")/.."
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
( cd "$tmp" && npm init -y >/dev/null && npm i --silent three@0.170.0 esbuild@0.24.0 >/dev/null )
sed 's#https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js#three#' ateliers/casey3d.js > "$tmp/casey3d.js"
"$tmp/node_modules/.bin/esbuild" "$tmp/casey3d.js" --bundle --minify --format=esm --target=es2020 --legal-comments=none \
  --outfile=ateliers/casey3d.min.js --log-level=warning
printf '/* Généré par tools/build-casey3d.sh depuis ateliers/casey3d.js (Three.js 0.170, licence MIT) : ne pas éditer. */\n' |
  cat - ateliers/casey3d.min.js > "$tmp/out.js" && mv "$tmp/out.js" ateliers/casey3d.min.js
echo "✓ ateliers/casey3d.min.js $(wc -c < ateliers/casey3d.min.js | tr -d ' ') octets ($(gzip -9 -c ateliers/casey3d.min.js | wc -c | tr -d ' ') compressé)"
