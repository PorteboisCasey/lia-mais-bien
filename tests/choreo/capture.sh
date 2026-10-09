#!/usr/bin/env bash
# Captures de validation (hors suite de tests) : 3 tailles × 5 progressions de scroll,
# plus la page sans JS à 375 et 1440. Usage : bash tests/choreo/capture.sh <dossier de sortie>
set -e
cd "$(dirname "$0")/../.."
. tests/lib.sh
out="${1:?dossier de sortie}"
mkdir -p "$out"
shot() { # shot <fichier> <largeur fenêtre> <hauteur> <url> [flags…]
  local file="$1" w="$2" h="$3" url="$4"; shift 4
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=8000 \
    --window-size="$w,$h" --screenshot="$file" "$@" "$url" 2>/dev/null
}
for size in 375x667 390x844 1440x900; do
  w="${size%x*}"; h="${size#*x}"
  win_w=$(( w < 500 ? 500 : w )) # fenêtre headless ≥ 500 px : la bande grise à droite est hors viewport
  for p in 0 0.25 0.5 0.75 1; do
    f="$out/casey-$size-p$p.png"
    shot "$f" "$win_w" "$h" "file://$PWD/tests/choreo/capture.html?w=$w&h=$h&p=$p" \
      --allow-file-access-from-files --force-prefers-no-reduced-motion
    echo "✓ $f"
  done
done
for w in 375 1440; do
  f="$out/nojs-$w.png"
  shot "$f" "$(( w < 500 ? 500 : w ))" 4200 "file://$PWD/tests/choreo/capture.html?w=$w&h=4200&nojs" \
    --allow-file-access-from-files
  echo "✓ $f"
done
