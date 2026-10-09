statut: terminé

## Fait
- Merges `feat/print` puis `feat/mascotte` (sans conflit), `bash tests/run.sh` vert après chacun.
- Tests d'abord : `tests/choreo/choreo.test.html` + `run.sh` (rouges contre le stub, commit 1cec08f), puis verts.
  `index.html` est chargé en iframe à 1440×900, 375×667 et 390×844 : `pathAt` (gouttières / `#stage` hors 80 px,
  siège à progress 0, trajet échantillonné sur 5000 points sans saut à l'écran), `poseFor`, poses à l'entrée de chaque
  section dans les deux sens, marche pendant le scroll puis arrêt, `face()` qui s'inverse, h1 jamais masqué,
  entrées terminées en bas de page, espion `question:sent` → `celebrate`, aucun `scrub` en reduced-motion.
- `js/choreo.js` :
  - `Choreo.pathAt(progress, vp)`, une fonction pure. Les bornes des segments sont celles des poses (`vp.stops` = haut de section au milieu de l'écran), ce qui garde trajet et poses calés.
  - Desktop : Casey zigzague (hero : il est assis sur `#casey-seat` puis saute dans la gouttière droite ; ensuite G, D, G, D, G). Il change de côté en sortant par le bas puis en rentrant par le haut : il ne passe jamais sur la colonne.
  - Mobile : allers-retours dans `#stage`.
  - Trajet par un proxy en `scrub: 0.3`, marche par `getVelocity()/1500`, `walk(0)` 300 ms après le scroll.
  - Entrées `words`/`draw`/`drop`/`pop`/`shine`/`hint` posées en JS. `gsap.matchMedia()` : en reduced-motion, Casey est fixe et prend la pose de la section.
- Choix validés par l'humain : traversée desktop « sort en bas, rentre en haut » ; saut hors du siège au 1er scroll ; Casey statique de `#moi` masqué quand le vrai est monté.
- `tests/choreo/capture.sh` + `capture.html` : captures 3 tailles × 5 progressions, et sans JS (iframe sandbox).

## Tests
- `bash tests/run.sh` → **Tout est vert** (unittest 12, Node 24, contract.html, casey ×2, choreo ×2), stable sur plusieurs passes.
- Checklist « fini » :
  - [x] `tests/run.sh` vert sur la branche intégrée, avec `tests/casey/run.sh` et `tests/choreo/run.sh`.
  - [x] 6 sections dans l'ordre, lisibles sans JS : `bash tests/choreo/capture.sh <dir>` → `nojs-375.png`, `nojs-1440.png`, vérifiées à l'œil.
  - [x] Casey hors colonne (desktop) et dans `#stage` hors bouton (mobile) : tests `pathAt` (5000 points par taille) + captures `casey-{375x667,390x844,1440x900}-p{0,0.25,0.5,0.75,1}.png` vérifiées à l'œil.
  - [x] Poses par section et marche au scroll : test choreo. Fluidité **validée par l'humain** sur iPhone.
  - [x] Reduced-motion : passe `--force-prefers-reduced-motion` (0 scrub, Casey immobile, pas de marche).
  - [x] URL C3 (fixtures, 24 tests Node) + `celebrate` (espion). Ouverture de WhatsApp **validée par l'humain**.
  - [x] Lighthouse mobile (`http://localhost:8003`) : perf 93 / a11y 100 (Chrome hérite de « Réduire les animations ») ; perf 99 / a11y 100 avec `--force-prefers-no-reduced-motion`.
  - [x] `assets/qr.svg` → SITE_URL, PDF 1 page A4 : preuves dans `2-print.md`.
  - [x] Test sur un vrai iPhone (Safari, IP locale) **validé par l'humain**.

## Dépendances
Aucune ajoutée. Lighthouse via `npx -y`, hors dépôt.

## Hors périmètre
- `index.html` : lien vers `css/casey.css` (oubli signalé par les agents 0 et 1).
- `css/sections.css` :
  - `#casey` est ancré en `left:0; bottom:0`. Sa position vient du `transform` posé par la chorégraphie, et l'ancrage en bas le rend insensible à la barre d'adresse mobile.
  - `.casey-live .buddy svg { display:none }` : pas de doublon, et le Casey statique reste visible sans JS.
  - Sous 480 px, `.me` passe sur une colonne : le numéro (`nowrap`) débordait de l'écran en 375 px. Le bug existait déjà dans le socle.
- Fichiers apportés par les merges des agents 1 et 2 (attendu).

## Vigilance
- Dans le hero, Casey passe de `sit` à `wave` dès que la page a bougé (il a quitté la bulle). `poseFor('hero')` reste `sit`.
- Tests navigateur en temps virtuel : `scrollTo` doit passer `behavior: 'instant'` (sinon `scroll-behavior: smooth` ne bouge pas), et l'accès aux iframes `file://` exige `--allow-file-access-from-files`.
- `--headless=new` ignore `--disable-javascript` : pour une capture sans JS, utiliser une iframe `sandbox` (voir `capture.html`).
- Textes validés par l'humain (plus de visio, FAQ à 6 questions) **pas encore appliqués** : à faire après ce merge.

## Questions
Aucune.
