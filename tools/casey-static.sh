#!/usr/bin/env bash
# Exporte Casey figé (une pose par fichier) depuis js/casey.js : bash tools/casey-static.sh <dossier>
# Sortie : <dossier>/casey-<pose>.svg. Exige Chrome et une connexion (GSAP depuis le CDN).
set -e
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
out="${1:?dossier de sortie}"
mkdir -p "$out"
"$CHROME" --headless=new --disable-gpu --virtual-time-budget=5000 --force-prefers-reduced-motion \
  --allow-file-access-from-files --dump-dom "file://$PWD/tools/casey-static.html" 2>/dev/null |
python3 -c '
import html, json, re, sys
m = re.search(r"<pre id=\"result\">(.*?)</pre>", sys.stdin.read(), re.S)
if not m or not m.group(1).strip():
    sys.exit("casey-static : export vide (GSAP chargé ?)")
for name, svg in json.loads(html.unescape(m.group(1))).items():
    path = f"{sys.argv[1]}/casey-{name}.svg"
    open(path, "w").write(svg)
    print("✓", path)
' "$out"
