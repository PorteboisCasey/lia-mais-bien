#!/usr/bin/env bash
# Tests navigateur de la chorégraphie : une passe normale, une passe reduced-motion.
# --allow-file-access-from-files : la page de test lit le DOM de index.html chargé en iframe (file://).
# La passe normale force « no-reduced-motion » (macOS « Réduire les animations » est hérité par Chrome).
set -e
cd "$(dirname "$0")/../.."
. tests/lib.sh
chrome_check tests/choreo/choreo.test.html --allow-file-access-from-files --force-prefers-no-reduced-motion
chrome_check tests/choreo/choreo.test.html --allow-file-access-from-files --force-prefers-reduced-motion
