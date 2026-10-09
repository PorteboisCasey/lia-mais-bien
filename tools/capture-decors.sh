#!/usr/bin/env bash
# Captures de relecture des décors : chaque section isolément, à 375 et 1440 px de large,
# avec JS en reduced-motion (contenu dans son état final), avec puis sans carte (?nocard : .card masquée pour voir le décor entier).
# Usage : bash tools/capture-decors.sh <dossier de sortie> [id…]   (par défaut les 6 sections)
# Sortie : <dossier>/<id>-<largeur>.png et <id>-<largeur>-nocard.png
set -e
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
out="${1:?dossier de sortie}"; shift
ids="${*:-hero apprendre infos moi faq question}"
mkdir -p "$out"
out="$(cd "$out" && pwd)"
harness="$out/_capture.html"

# Page hôte : index.html dans une iframe de largeur w, aussi haute que la page (les éléments fixes,
# #stage et Casey, tombent en bas, hors de la section), décalée pour que la section soit en (0, 0).
# ?measure : écrit la position et la hauteur de chaque section dans <pre id="result">.
cat > "$harness" <<EOF
<!doctype html><html><head><meta charset="utf-8">
<style>html, body { margin: 0; overflow: hidden; background: #888; } iframe { display: block; border: 0; }</style>
</head><body><pre id="result"></pre><script>
var q = new URLSearchParams(location.search), W = +q.get('w');
var f = document.createElement('iframe');
f.style.width = W + 'px';
f.style.height = (+q.get('full') || 6000) + 'px';
f.style.marginLeft = Math.max(0, (innerWidth - W) / 2) + 'px'; // centré : sips rogne au centre
f.src = 'file://$PWD/index.html';
f.onload = function () {
  var d = f.contentDocument;
  if (q.has('nocard')) d.head.insertAdjacentHTML('beforeend', '<style>.card { visibility: hidden; }</style>');
  setTimeout(function () {
    if (q.has('measure')) {
      var r = { full: d.documentElement.scrollHeight };
      d.querySelectorAll('section').forEach(function (s) {
        var b = s.getBoundingClientRect();
        r[s.id] = [Math.round(b.top + f.contentWindow.scrollY), Math.round(b.height)];
      });
      document.getElementById('result').textContent = JSON.stringify(r);
    } else {
      f.style.marginTop = -q.get('top') + 'px';
    }
  }, 4000);
};
document.body.appendChild(f);
</script></body></html>
EOF

for w in 375 1440; do
  win_w=$(( w < 500 ? 500 : w )) # fenêtre headless ≥ 500 px ; les bandes grises sont rognées ensuite
  json="$("$CHROME" --headless=new --disable-gpu --allow-file-access-from-files --virtual-time-budget=10000 \
    --window-size="$win_w,900" --dump-dom "file://$harness?w=$w&measure" 2>/dev/null \
    | sed -n 's:.*<pre id="result">\(.*\)</pre>.*:\1:p')"
  [ -n "$json" ] || { echo "mesure impossible à $w px" >&2; exit 1; }
  full="$(printf '%s' "$json" | python3 -c 'import json,sys; print(json.load(sys.stdin)["full"])')"
  for id in $ids; do
    read -r top h <<<"$(printf '%s' "$json" | python3 -c 'import json,sys; t,h=json.load(sys.stdin)[sys.argv[1]]; print(t,h)' "$id")"
    for variant in "" "-nocard"; do
      f="$out/$id-$w$variant.png"
      "$CHROME" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
        --force-prefers-reduced-motion --virtual-time-budget=10000 --window-size="$win_w,$h" \
        --screenshot="$f" "file://$harness?w=$w&full=$full&top=$top${variant:+&nocard}" 2>/dev/null
      if [ "$w" -lt "$win_w" ]; then sips -c "$h" "$w" "$f" >/dev/null; fi
      echo "✓ $f"
    done
  done
done
rm -f "$harness"
