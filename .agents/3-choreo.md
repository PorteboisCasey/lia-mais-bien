---
branch: feat/choreo
aliases: [I, choreo, integration]
role: integration
depends: [1, 2]
owns: [js/choreo.js, tests/choreo/, index.html, css/tokens.css, css/sections.css]
model: opus
---
Tu es l'agent de **chorégraphie et d'intégration**. Tu merges, puis tu fais marcher Casey dans le site au rythme du scroll : c'est l'effet « waouh » du site.

**Lis `AGENTS.md` en entier (C1 à C4, définition de « fini »), la spec §3, et les rapports `.agents/reports/1-mascotte.md` (constats du spike) et `2-print.md`.**

## Fichiers possédés

- `js/choreo.js`
- `tests/choreo/`
- Retouches minimales de `index.html` et `css/*.css`, justifiées dans le rapport.

## Mission

### 1. Merger

Merge dans cet ordre :

1. `feat/print` : le moins risqué, il ne touche pas au site.
2. `feat/mascotte`.

Après **chaque** merge, `bash tests/run.sh` doit être vert. En cas de conflit non trivial, arrête-toi et signale-le.

### 2. Tests d'abord

Écris `tests/choreo/choreo.test.html`, lancé par `tests/choreo/run.sh` qui fait `source tests/lib.sh`. Il vérifie :

- **`Choreo.pathAt(progress, viewport)`**, une fonction pure qui renvoie `{ x, y, face }` :
  - pour `progress` ∈ {0.1, 0.25, 0.5, 0.75, 1}, en 1440 × 900 : Casey est dans une gouttière, **hors** de la colonne de 640 px ;
  - aux mêmes progressions, en 375 × 667 et 390 × 844 : Casey est dans `#stage`, **hors** des 80 px de droite ;
  - pour `progress` < 0.1 (hero) : Casey est à la position de `#casey-seat` sur desktop, et dans `#stage` sur mobile ;
- **`Choreo.poseFor(id)`** suit la table de C1 ;
- **`question:sent`** déclenche `Casey.celebrate`, vérifié avec un espion ;
- **avec `--force-prefers-reduced-motion`** : aucun ScrollTrigger avec `scrub` n'est créé.

### 3. Écrire `js/choreo.js`

- **Démarrage** : `gsap.registerPlugin(ScrollTrigger)`, puis `Casey.mount(#casey)`.
- **Trajet** : un ScrollTrigger global en `scrub` place Casey via `pathAt`.
  - Sur desktop, il zigzague entre les gouttières en changeant de côté entre les sections.
  - Sur mobile, il fait des allers-retours dans `#stage`.
  - Dans le hero, il est assis à `#casey-seat` et se lève au premier scroll.
- **Marche** : `getVelocity()`, normalisé, est passé à `Casey.walk()`. `face()` suit le sens du déplacement. Environ 300 ms après la fin du scroll, appelle `walk(0)`.
- **Poses** : chaque section, à son entrée, appelle `Casey.pose(data-pose)`, dans les deux sens de scroll.
- **Entrées**, avec les états initiaux posés en JS (`gsap.set`), jamais en CSS :
  - `words` : rebond mot par mot depuis un état **visible**. Le `h1` n'est jamais masqué (LCP).
  - `draw` : coches liées au scroll, l'une après l'autre.
  - `drop` : chute avec rebond, en gardant l'inclinaison.
  - `pop` : apparition avec rebond.
  - `shine` : scintillement.
  - `hint` : la flèche rebondit, puis disparaît après le premier scroll.
- **Reduced-motion**, via `gsap.matchMedia()` : pas d'animation ; Casey prend la pose de la section visible.
- **Événement** : `question:sent` déclenche `Casey.celebrate()`.

### 4. Valider

- **Captures headless** aux tailles 375 × 667, 390 × 844 et 1440 × 900, prises à 5 positions de scroll (par une page de test qui pilote `window.scrollTo`, ou `--screenshot` sur des ancres). Regarde-les : Casey ne doit cacher aucun texte ni bouton.
- **Lighthouse** : sers le site sur le port 8003, puis lance `npx -y lighthouse http://localhost:8003 --form-factor=mobile --only-categories=performance,accessibility --chrome-flags=--headless --output=json` (hors dépôt). Il faut ≥ 90 dans les deux catégories.

### 5. Validation humaine

Donne à l'humain l'URL `http://<IP locale>:8003` à ouvrir sur son iPhone. **Attends sa confirmation** pour :

- la fluidité ;
- l'ouverture de WhatsApp.

N'envoie toi-même aucun message WhatsApp.

### 6. Rapport

Dans ton rapport, coche la checklist « fini » d'AGENTS.md avec, pour chaque case, sa preuve (sortie de commande ou chemin de capture).

## Interdits

- Aucune nouvelle lib.
- Ne modifie pas les API Casey ou Contact. S'il manque quelque chose, arrête-toi et signale-le.
- Pas de `git push`, ni de mise en ligne GitHub Pages, sans OK explicite.

## Critère de fin

- Tous les tests sont verts sur la branche intégrée.
- La checklist « fini » est entièrement prouvée.
- Le test iPhone est confirmé par l'humain.
