---
branch: feat/mascotte
aliases: [M, mascotte, casey]
role: worker
depends: [0]
owns: [js/casey.js, css/casey.css, dev/, tests/casey/]
model: opus
---
Tu es l'agent **mascotte**. Tu donnes vie à Casey, le bonhomme de l'affiche. C'est la pièce la plus visible et la plus risquée du site : il doit être expressif, fluide et fidèle au trait de l'affiche.

**Lis `AGENTS.md` en entier (surtout C2 et ses règles d'état), puis la spec, puis les `<defs>` de `affiche/affiche.html` (`#head`, `#sit`, `#stand`).**

## Fichiers possédés

- `js/casey.js` (tu remplaces le stub)
- `css/casey.css`
- `dev/`
- `tests/casey/`

## Mission

### 1. Spike d'abord (≈ 30 min, jetable)

Crée `dev/spike-scroll.html` : une page longue avec ScrollTrigger et un Casey grossier (2 jambes). Elle sert à vérifier en vrai que les règles d'état C2 (marche par-dessus une pose, dernier appel gagnant, fête) se pilotent proprement depuis un scroll `scrub` + `getVelocity()`.

Si une règle s'avère intenable, **arrête-toi** (statut `bloqué`) et propose l'amendement de C2. Sinon, garde la page comme démo et note tes constats dans le rapport.

### 2. Tests d'abord

Écris `tests/casey/casey.test.html` (mécanisme `<pre id="result">`) et `tests/casey/run.sh`, qui fait `source tests/lib.sh` puis `chrome_check`. Une passe normale couvre :

- chaque `pose(p)` résout sa Promise et pose `data-pose="p"` ;
- **dernier appel gagnant** : `pose('wave')` puis `pose('think')` aussitôt, la 1re Promise se résout et l'état final vaut `think` ;
- `walk(0.5)` pose `data-walking="true"` sans changer `data-pose`, puis `walk(0)` le retire ;
- `walk(2)` et `walk(-1)` sont bornés ;
- `face('left')` inverse l'axe X ;
- `celebrate()` pendant laquelle on appelle `pose('phone')` : la fête finit, puis l'état vaut `phone` ;
- `mount` appelé deux fois ne produit qu'un seul SVG.

Une seconde passe avec `--force-prefers-reduced-motion` vérifie que `pose` s'applique sans transition et que `walk` ne fait rien.

### 3. Rig

Un seul SVG, fidèle à l'affiche : trait `#111` de 2.2, casquette `#FF4D00`, lunettes, épis, sourire. Il est découpé en `<g data-part>` :

- `head`, avec `eyes` et `mouth` internes ;
- `torso` ;
- `armL` et `armR` (avec un coude si nécessaire) ;
- `legL` et `legR` ;
- `laptop` et `phone`, masqués par défaut.

Les pivots se règlent avec `gsap.set(…, { svgOrigin })`.

### 4. Les 8 poses

Chaque pose est un jeu de transformations par partie, interpolées par GSAP :

| Pose | Description |
|---|---|
| `sit` | Assis, laptop sur les genoux |
| `idle` | Respiration en boucle, clignement aléatoire |
| `walk` | Base de la marche |
| `point` | Bras tendu |
| `wave` | Salut en boucle |
| `think` | Main au menton, yeux en l'air |
| `phone` | Tient le téléphone |
| `party` | Bras en l'air, saut, éclats |

### 5. Marche

Une timeline GSAP en boucle : jambes et bras en opposition, avec un léger rebond. `walk(speed)` règle sa vitesse via `timeScale`, en respectant les règles 4 et 7 de C2.

### 6. Démo

Crée `dev/casey.html` avec un bouton par pose, un slider de marche, un bouton gauche/droite et un bouton `celebrate`. C'est la page que l'humain regardera pour valider le personnage. Sers-la sur le port **8001**.

### 7. CSS

`css/casey.css` ne contient que la taille (`--casey-size`) et le rendu. **Pas** de positionnement dans la page.

## Interdits

- Ne touche pas à `index.html`, aux CSS du socle, ni à `tests/run.sh`, `tests/lib.sh` ou `tests/fixtures/`.
- Ne dépends pas de ScrollTrigger dans `casey.js`. Le spike peut l'utiliser.
- N'ajoute aucune lib.

## Critère de fin

- `bash tests/run.sh` est vert (il inclut `tests/casey/run.sh`).
- `dev/casey.html` montre les 8 poses et la marche de façon fluide.
- Le rapport contient les constats du spike.
