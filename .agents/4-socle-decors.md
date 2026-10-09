---
branch: main
aliases: [S, socle-decors]
role: setup
depends: []
owns: [index.html, css/tokens.css, css/sections.css, tests/test_decors.py, tools/capture-decors.sh, assets/decors/, AGENTS.md]
model: opus
---
Tu es l'agent **socle décors**. Tu poses tout ce dont le dessinateur aura besoin (mise en page, contrats chiffrés, outils de relecture), puis tu dessines la scène de référence qui fixera le style des cinq autres. Si ta scène est ratée, tout le chantier l'est : prends le temps qu'il faut.

**Lis `AGENTS.md` en entier, en particulier « Chantier 2 · Décors » (C1 amendé, C5, C6), puis la spec `docs/superpowers/specs/2026-10-09-decors-design.md`.** Là où elles divergent, AGENTS.md fait foi.

## 1. Tests d'abord : `tests/test_decors.py`

unittest, stdlib uniquement (`html.parser`, `xml.etree`, `re`, `pathlib`). Il est **rouge** avant la suite. Il vérifie tout ce que C5 marque « testé » :
- chaque `<section>` a un seul enfant élément, un `div.card` ;
- les 12 fichiers existent, et chaque `url(...)` de `css/sections.css` qui pointe vers `assets/decors/` existe ;
- chaque SVG : XML valide, racine, `viewBox`, `width` et `height` de C5, 20 Ko max, aucun élément ni attribut interdit, aucun nombre décimal ;
- couleurs : normalisation (minuscules, `#abc` → `#aabbcc`), appartenance à la palette C6, `fill` explicite (ou hérité d'un `<g>`) sur toute forme fermée, noms de couleur et `currentColor` refusés ;
- `css/sections.css` ne contient plus la trame ni `.hero-bubble::before`.

La palette est une constante du test, recopiée de C6. Toute modification de C6 se fait aux deux endroits dans le même commit.

## 2. Cases, cartes, stubs, outil de captures

- `index.html` : enveloppe le contenu de chaque section dans `<div class="card">` (dans le hero : kicker, bulle, sous-titre, flèche). Ne change ni l'ordre, ni les ids, ni les `data-*`.
- `css/tokens.css` : `--decor-<id>`, `--floor-<id>`, `--band-top`/`--band-bottom` (160/120 px, 220/180 px à partir de 1024 px).
- `css/sections.css` : retire la trame, les lignes de vitesse et le détourage du kicker ; ajoute les cases (cadre, gouttière 12 px, débordement de `main`), les cartes et les arrière-plans des 6 sections dans l'ordre de couches de C1, déjà branchés sur les 12 fichiers.
- `assets/decors/` : 12 stubs conformes à C5 (sol plein sur les bandes du bas, un rectangle à bord noir dans la zone essentielle).
- **Garde le padding des sections serré sur mobile.** Le public arrive par le QR code, donc sur téléphone : le décor ne doit pas rallonger la page pour rien. Mesure `document.documentElement.scrollHeight` à 375 px avant et après, et note les deux valeurs dans ton rapport.
- `tools/capture-decors.sh <dossier>` : capture **chaque section isolément** à 375 et 1440 px de large (hauteur de la section), avec JS, en t'inspirant des contournements de `tests/choreo/capture.sh` (fenêtre ≥ 500 px, largeur fixée par iframe). Ajoute une variante où `.card` est masquée (`?nocard`), pour voir le décor entier.
- Hero : si le double cadre carte + bulle est trop chargé, la carte du hero perd bordure et ombre.

Vérifie : `bash tests/run.sh` vert, captures relues, aucun défilement horizontal. Commit.

## 3. Chiffrer les contrats

- Mesure à 375 px quelle hauteur des bandes reste visible au-dessus et au-dessous de la carte, en unités du viewBox. Écris `N` et `M` dans C5 à la place de « À MESURER ».
- Complète la palette C6 en parcourant **les 6 lignes** du tableau des scènes de la spec (cerisier, toit, néons, écran de code, dos de livres, guirlande, ciel du soir…). Mets à jour la constante du test. Commit.

## 4. La scène de référence `apprendre`

- `apprendre-haut.svg` : tableau vert avec trois mots à la craie **dessinés en traits** (pas de `<text>`), fenêtres avec ciel, horloge.
- `apprendre-bas.svg` : rangées de tables et de chaises vues de face, sol.

Respecte C5 et C6. Mets l'essentiel dans x de 550 à 1050 et dans la zone visible `N`/`M`. Les bords doivent rester en grands aplats. Itère sur `tools/capture-decors.sh` jusqu'à ce que ce soit beau à 375 **et** à 1440. Commit.

Puis lance Lighthouse sur `python3 -m http.server 8004` :
`npx -y lighthouse http://localhost:8004/ --form-factor=mobile --only-categories=performance,accessibility --chrome-flags=--headless`
Les deux scores doivent être ≥ 90, et le LCP doit rester le `h1` (vérifie l'élément LCP dans le rapport JSON). Note les scores.

## 5. Point d'arrêt humain

Montre à l'humain :
- les captures de `apprendre` à 375 et 1440, avec et sans carte ;
- la capture sans JS pleine page à 375 (`tests/choreo/capture.sh`), pour juger la longueur de la page mobile ;
- les hauteurs de page avant et après.

Demande-lui : « La mise en page et le style de la salle de classe te vont pour les 5 autres scènes ? » **N'écris pas ton rapport « terminé » avant un oui clair** : ce rapport déclenche le dessinateur. Applique ses retours, recapture, redemande.

## Interdits

- Toucher `js/`, `tests/choreo/`, `tests/casey/`, `tests/run.sh`, `tests/lib.sh`, l'affiche.
- Pousser sur `origin`.

## Fini quand

`bash tests/run.sh` est vert (avec `test_decors.py`), `N`, `M` et la palette sont dans C5/C6, Lighthouse est ≥ 90, l'humain a validé, et le rapport est commité sur `main` avec les chemins des captures, les scores et les hauteurs de page.
