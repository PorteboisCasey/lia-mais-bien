statut: terminé

## Fait
- `tests/test_decors.py` (écrit rouge d'abord) : une `div.card` unique par section, 12 fichiers et `url()` existants, chaque section branche ses deux bandes, racine/viewBox/width/height C5, 20 Ko max, balises et attributs interdits (dont `on*`), aucun décimal, `fill` explicite ou hérité d'un `<g>` sur les formes fermées, palette C6 normalisée, trame / `.hero-bubble::before` / `text-shadow` absents.
- `index.html` : contenu de chaque section dans `<div class="card">` (ordre, ids, `data-*` inchangés).
- `css/tokens.css` : `--decor-<id>`, `--floor-<id>`, `--band-top`/`--band-bottom` (160/120, 220/180 dès 1024 px).
- `css/sections.css` : trame, lignes de vitesse et détourage du kicker retirés ; `html { overflow-x: clip }` ; cases (débordement de `main`, cadre 4,5 px en haut et en bas, gouttière 12 px) ; cartes ; 4 couches de décor par section dans l'ordre C1 (couche sol avec son trait d'encre, proportions de la ligne de sol y = 130). Carte du hero sans bordure ni ombre (double cadre avec la bulle trop chargé). Padding des sections : 64/52 px sur mobile, 120/104 px sur desktop.
- `tools/capture-decors.sh <dossier> [id…]` : chaque section isolée à 375 et 1440, avec et sans carte (`?nocard`), en reduced-motion pour que le contenu soit dans son état final.
- `assets/decors/` : 10 stubs conformes, et la scène `apprendre` (tableau vert « LIRE → TESTER → VÉRIFIER » à la craie en traits, horloge, fenêtres sur le ciel, plante et livres ; tables et chaises de face, parquet, bibliothèque, poubelle, plante).
- `AGENTS.md` : C5 `N = 88`, `M = 108`, convention de la ligne de sol ; C6 complétée (6 couleurs) et recopiée dans le test.
- Validation humaine : mise en page et style de la salle de classe validés (« oui »).

## Tests
- `bash tests/run.sh` → « Tout est vert. » (`test_decors.py` inclus, choreo normal et reduced-motion).
- `tests/choreo/capture.sh` : Casey hors colonne (desktop) et dans `#stage` (mobile), `scrollWidth == clientWidth` à 375 et 1440.
- Lighthouse mobile (`npx -y lighthouse http://localhost:8004/ --form-factor=mobile …`) : performance 92, accessibilité 100 (avant le chantier : 92 / 100). LCP 2,8 s (avant : 2,7 s).
- Hauteur de page à 375 px (`scrollHeight`) : 2784 px avant, 3366 px après (+21 %).
- Captures (scratchpad, hors dépôt) : `/private/tmp/claude-501/-Users-postg0d-Desktop-cours/af3842bc-451c-42aa-91a8-a88f041dfa33/scratchpad/revue/` (`apprendre-375[-nocard].png`, `apprendre-1440[-nocard].png`, `page-sans-js-375.png`).

## Dépendances
Aucune.

## Hors périmètre
- `tests/choreo/choreo.test.html` (1 ligne + commentaire) : le test « face() s'inverse » scrollait de `apprendre.offsetTop + 20` à `+ 80` et supposait qu'aucune frontière de segment ne tombait dans cette fenêtre. Avec les sections plus hautes, la frontière d'`infos` y tombait (71 px sur mobile, 62 px sur desktop). La fenêtre est désormais centrée entre `vp.stops[1]` et `vp.stops[2]`. Modification autorisée par l'humain et appliquée par lui (le hook de périmètre bloquait l'agent).

## Vigilance
- **LCP** : l'élément LCP n'est plus le `h1` mais le fond de `#apprendre` (une bande de 375 × 160 px est plus grande que le bloc du titre ; les stubs y échappent car Chrome ignore les images de très faible entropie). Le temps ne bouge presque pas (2,7 → 2,8 s). Dès que le hero sera dessiné, son décor sera le LCP. Proposition faite à l'humain : remplacer le critère « LCP = `h1` » par « LCP pas plus lent qu'avant et performance ≥ 90 ». Il a répondu « oui » sans préciser s'il validait ce point : à confirmer par l'orchestrateur.
- Sur desktop, la carte couvre x 504 à 1096 dès y = 120 (haut) et jusqu'à y = 80 (bas) : l'essentiel doit rester dans la zone `N`/`M`, les bords sont visibles en entier.
- Une carte opaque cache le centre des bandes : vérifier chaque scène avec `tools/capture-decors.sh <dossier> <id>` et sa variante `-nocard`.
- Le générateur de la scène `apprendre` (lettres à la craie en chemins entiers) est resté dans le scratchpad. La police de craie (L, I, R, E, T, S, V, É, F sur une grille 12 × 20) peut servir de modèle si une autre scène a besoin de lettres.
- `sips -c` rogne au centre : `capture-decors.sh` centre l'iframe en conséquence (macOS seulement).

## Questions
Aucune. La mise en ligne reste du ressort de l'orchestrateur, après ton OK.
