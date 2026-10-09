statut: terminé

## Fait
- 10 SVG dessinés dans le style de `apprendre`, un commit par scène :
  - `hero` : école (toit en tuiles, horloge), soleil, nuages, grille, trottoir, marelle, cerisier, réverbère ;
  - `infos` : néons, panneau d'affichage avec feuilles punaisées, carte du monde, sortie de secours, casiers, banc, carrelage ;
  - `moi` : étagère, post-it, plante suspendue, fenêtre sur la ville, bureau long avec deux écrans de code en traits, chaises ;
  - `faq` : rayonnages de livres colorés sans texte, fenêtre en arc, chariot de livres, grande table, lampe, globe ;
  - `question` : guirlande, fenêtre du soir avec rideaux, lit, bureau avec lampe, téléphone allumé sur une table de nuit.
- Retour humain appliqué sur `question` : le téléphone (seule touche d'accent) était à x ≈ 1160 et au-dessus de y = 108, donc invisible à 375 px. Il est passé sur une table de nuit basse, à x = 632–652 et y = 108–138, dans la zone visible `N`/`M`.
- Validation humaine : « Les 6 scènes te vont ? » → « Oui, les 6 me vont ».
- Aucune retouche de `css/`, `index.html`, `AGENTS.md` ni de la palette : C6 a suffi.

## Tests
- `bash tests/run.sh` → « Tout est vert. » (`test_decors.py` inclus, casey et choreo en mouvement normal et en reduced-motion).
- `bash tests/choreo/capture.sh <scratchpad>/choreo` : relu à 375 × 667, 390 × 844 et 1440 × 900, aux positions p0 à p1. Casey est assis sur la carte du hero, dans les gouttières sur desktop et dans `#stage` sur mobile, sans défilement horizontal visible.
- Lighthouse mobile (`http://localhost:8005/`) : performance **98**, accessibilité **100**. LCP 2,2 s, CLS 0,004, TBT 0 ms. L'agent 4 mesurait 92 / 100 avec un LCP de 2,8 s.
- `bash ~/.claude/scripts/agent-prompt.sh check` → aucun fichier hors périmètre.
- Taille des SVG : de 2,4 à 10 Ko (`faq-haut`, le plus gros), sous la limite de 20 Ko.
- Captures (scratchpad, hors dépôt) : `/private/tmp/claude-501/-Users-postg0d-Desktop-cours--worktrees-feat-decors-scenes/fd0620ab-7fd8-4387-b46e-8c3acf5bbfb8/scratchpad/decors/` (`<id>-375[-nocard].png`, `<id>-1440[-nocard].png`) et `…/scratchpad/choreo/`.

## Checklist « fini » du chantier 2
- [x] `bash tests/run.sh` passe, avec `test_decors.py` (après le fast-forward sur `main`, c'est le même commit).
- [x] Les 12 SVG respectent C5 et C6 (testé) ; relecture visuelle faite.
- [x] `tools/capture-decors.sh` : chaque section montre son décor à 375 et 1440.
- [x] `tests/choreo/capture.sh` : rien ne dépasse, Casey reste hors colonne et dans `#stage`.
- [x] Lighthouse mobile ≥ 90 / 90 (98 / 100).
- [x] Style validé par l'humain (6 scènes).
- [ ] Mise en ligne et test iPhone : à faire par l'humain et l'orchestrateur.

## Dépendances
Aucune.

## Hors périmètre
Aucun.

## Vigilance
- `python3 -m unittest tests.test_decors`, la commande donnée dans le prompt, échoue avec `ModuleNotFoundError: test_structure`, car le test importe un module voisin. La forme qui marche est `python3 -m unittest discover -s tests -p 'test_decors.py'`, celle de `tests/run.sh`.
- `hero-haut` et `faq-haut` : l'école et la bibliothèque sont coupées net à y = 220, en bas de la bande. La carte cache cette coupure à 375 et à 1440, mais elle se voit avec `?nocard`, et elle se verrait si la carte rétrécissait.
- Le LCP n'est plus le `h1`, comme l'avait prévu l'agent 4. Le temps s'est amélioré (2,2 s) et le score de performance est de 98.
- `tests/choreo/capture.sh` ne fait que des captures, sans assertion : la vérification « hors colonne / dans `#stage` » est visuelle. Les assertions chiffrées sont dans `choreo.test.html` (`pathAt`).

## Questions
Aucune. Push sur `origin/main` : à faire par l'orchestrateur après ton OK.
