#!/usr/bin/env bash
# Tests navigateur de la mascotte (C2) : une passe normale, une passe reduced-motion.
# La passe normale force « no-reduced-motion » : sinon Chrome hérite du réglage
# macOS « Réduire les animations » et bascule dans la branche reduced-motion.
set -e
cd "$(dirname "$0")/../.."
. tests/lib.sh
chrome_check tests/casey/casey.test.html --force-prefers-no-reduced-motion
chrome_check tests/casey/casey.test.html --force-prefers-reduced-motion
