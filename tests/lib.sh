# Fonctions partagées des tests navigateur. À sourcer : . tests/lib.sh
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
TESTS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# chrome_check <fichier.html> [flags chrome…]
# Charge la page (budget de temps virtuel : 20 s, la chorégraphie attend l'effacement des bulles), lit <pre id="result"> (relance jusqu'à 3 fois s'il est vide).
# Succès si le résultat vaut exactement « OK » ; sinon affiche les échecs.
chrome_check() {
  local page="$1"; shift
  case "$page" in /*) ;; *) page="$TESTS_ROOT/$page" ;; esac
  local result="" try dom
  for try in 1 2 3; do
    dom="$("$CHROME" --headless=new --disable-gpu --virtual-time-budget=20000 \
      --dump-dom "$@" "file://$page" 2>/dev/null || true)"
    result="$(printf '%s' "$dom" | python3 -c '
import re, sys, html
m = re.search(r"<pre id=\"result\"[^>]*>(.*?)</pre>", sys.stdin.read(), re.S)
print(html.unescape(m.group(1)).strip() if m else "", end="")')"
    [ -n "$result" ] && break
  done
  if [ "$result" = "OK" ]; then
    echo "✓ $(basename "$page") $*"
    return 0
  fi
  echo "✗ $(basename "$page") $*" >&2
  echo "${result:-(résultat vide après 3 essais)}" >&2
  return 1
}
