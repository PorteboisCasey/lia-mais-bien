#!/usr/bin/env bash
# Lance tous les tests ; sort en code ≠ 0 au premier échec.
set -e
cd "$(dirname "$0")/.."
. tests/lib.sh

node_major="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$node_major" -lt 21 ]; then
  echo "Node ≥ 21 requis (glob de node --test), trouvé $(node -v)" >&2
  exit 1
fi

echo "== Structure (C1)"
python3 -m unittest discover -s tests -p 'test_*.py'

echo "== Contact (C3)"
node --test 'tests/**/*.test.mjs'

echo "== Navigateur : contrats C2 + C3"
chrome_check tests/contract.html

for s in tests/*/run.sh; do
  [ -e "$s" ] || continue
  echo "== $s"
  bash "$s"
done

echo "Tout est vert."
