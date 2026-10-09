---
branch: feat/decors-scenes
aliases: [D, scenes, decors]
role: integration
depends: [4]
owns: [assets/decors/hero-haut.svg, assets/decors/hero-bas.svg, assets/decors/infos-haut.svg, assets/decors/infos-bas.svg, assets/decors/moi-haut.svg, assets/decors/moi-bas.svg, assets/decors/faq-haut.svg, assets/decors/faq-bas.svg, assets/decors/question-haut.svg, assets/decors/question-bas.svg, css/tokens.css, css/sections.css, index.html, AGENTS.md, tests/test_decors.py]
model: opus
---
Tu es l'agent **scènes**. Tu dessines les 5 décors restants dans le style exact de la salle de classe validée par l'humain, tu vérifies l'ensemble et tu ramènes le tout sur `main`.

**Lis `AGENTS.md` en entier (« Chantier 2 · Décors » : C1, C5 avec `N`/`M`, C6), la spec `docs/superpowers/specs/2026-10-09-decors-design.md`, le rapport de l'agent 4 (`.agents/reports/4-socle-decors.md`), puis étudie `assets/decors/apprendre-haut.svg` et `apprendre-bas.svg`. C'est ta référence : épaisseur de trait, arrondis, densité de détails, façon de dessiner le bois et les fenêtres, aplats sur les bords.**

## Fichiers possédés

- Les 10 SVG hors `apprendre-*` : ce sont des stubs, tu les remplaces. `apprendre-*` est en lecture seule.
- `css/*.css` et `index.html` : retouches minimales seulement, justifiées dans le rapport.
- C6 de `AGENTS.md` et la constante de palette de `tests/test_decors.py` : seulement pour ajouter une couleur indispensable, aux deux endroits dans le même commit, avec une ligne de justification dans le rapport.

## Mission

Les tests existent : `python3 -m unittest tests.test_decors` après chaque fichier. Pour chaque scène, mets l'essentiel dans x de 550 à 1050 et dans la zone visible `N`/`M`, garde les bords en grands aplats, puis relis avec `bash tools/capture-decors.sh <scratchpad>` à 375 et 1440 (avec et sans carte). Compare côte à côte avec `apprendre` : même trait, même densité. Commit après chaque scène.

1. **`hero`** (devant l'école).
   - Haut : ciel (l'aplat passe dessous), nuages ronds, toit de l'école et horloge.
   - Bas : grille, trottoir, cerisier sur un bord.
   - Sur desktop, Casey est assis au-dessus de la bulle du titre : rien de chargé juste derrière lui (capture 1440 de `tests/choreo/capture.sh` à p0).
2. **`infos`** (couloir).
   - Haut : néons, panneau d'affichage avec des feuilles punaisées.
   - Bas : casiers alignés, carrelage.
3. **`moi`** (bureau d'alternant).
   - Haut : étagère, plante, post-it.
   - Bas : bureau, écran avec du code **en traits**, chaise.
4. **`faq`** (CDI / bibliothèque).
   - Haut : rayonnages, dos de livres colorés sans texte.
   - Bas : grande table, lampe.
5. **`question`** (chambre, le soir).
   - Haut : fenêtre avec ciel du soir, guirlande.
   - Bas : lit, bureau avec un téléphone allumé (petite touche d'accent).
   - C'est la scène du formulaire : elle doit donner envie d'écrire, pas distraire. Garde le bas sobre : `#wa-float` et `#stage` sont en bas de l'écran sur mobile.

## Vérifications finales

- `bash tests/run.sh` : tout vert.
- `bash tests/choreo/capture.sh <scratchpad>` : aucun défilement horizontal, Casey hors colonne (desktop) et dans `#stage` (mobile).
- Lighthouse sur `python3 -m http.server 8005` : performance et accessibilité ≥ 90.

## Point d'arrêt humain

Montre à l'humain les 5 scènes à 375 et 1440 (chemins des captures, avec et sans carte), à côté de `apprendre`. Demande : « Les 6 scènes te vont ? » Applique ses retours scène par scène, recapture, redemande. **N'écris pas ton rapport « terminé » et ne ramène rien sur `main` avant un oui clair.**

## Interdits

- `git push` : la mise en ligne est faite par l'orchestrateur après l'OK humain.
- Modifier `js/`, `apprendre-*`, `tests/choreo/`, `tests/casey/`, `tests/run.sh`, `tests/lib.sh`, l'affiche.
- Contourner C5. Si une scène est impossible avec C5/C6, arrête-toi (`bloqué`) et explique quoi changer.

## Fini quand

La checklist « fini » du chantier 2 est cochée dans le rapport (hors mise en ligne et iPhone, laissés à l'humain), avec les scores Lighthouse et les chemins des captures, et `feat/decors-scenes` est ramenée sur `main`.
