# AGENTS.md — site « L'IA, mais bien »

Spec produit : `docs/superpowers/specs/2026-10-09-site-lia-mais-bien-design.md`. **Lis-la en entier.**
**En cas de divergence, AGENTS.md fait foi** : il fixe le découpage, les contrats et les numéros d'agents. La spec décrit le produit.

Le site est statique et sans build : HTML/CSS/JS classiques, sans modules ES ni npm, servi par GitHub Pages. La source visuelle est `affiche/affiche.html` : couleurs, polices et SVG de la mascotte.

## Constantes

| Nom | Valeur |
|---|---|
| `SITE_URL` | `https://porteboiscasey.github.io/lia-mais-bien/` |
| Numéro | `33609148090`. Il est **public** (imprimé sur l'affiche) : **ne pas l'anonymiser** dans les fixtures ni dans les tests. |

## Contrats (figés par la phase 0)

Un agent qui doit changer un contrat **s'arrête et le signale**. Il ne le contourne pas.

### C1. Structure HTML (`index.html`)

- **Sections** : `<section id="…" data-pose="…">`, dans cet ordre :
  `hero`/`sit`, `apprendre`/`point`, `infos`/`idle`, `moi`/`wave`, `faq`/`think`, `question`/`phone`.
- **`data-anim`** est posé par le socle et animé par la chorégraphie. Valeurs possibles :
  - `words` : titre du hero, découpé en `<span class="w">` ;
  - `draw` : `<path>` à dessiner (coches des promesses, trait ondulé) ;
  - `drop` : les 3 stickers ;
  - `pop` : la bulle « C'est moi ! » ;
  - `shine` : les éclats du titre ;
  - `hint` : la flèche « scrolle ».
- **Mascotte** : `<div id="casey" aria-hidden="true"></div>`, enfant direct de `<body>`, suivi de `<div id="casey-bubble" aria-hidden="true" hidden></div>` (bulle de pensée, voir « Casey progression » plus bas).
- **Scène** (mobile, et desktop depuis « Casey progression ») : `<div id="stage" aria-hidden="true">`, une bande fixe en bas de **96 px**. Elle est opaque (fond papier) et porte une bordure haute en pointillés, comme la ligne de découpe de l'affiche. Casey y marche. `#wa-float` est posé à droite dans la bande, et la zone de Casey **exclut les 80 px de droite**. Le `body` a un `padding-bottom: 96px`.
- **Desktop** (≥ 1024 px) : contenu centré sur 640 px max. ~~Casey se déplace dans les gouttières latérales, et `#stage` est masqué.~~ Remplacé par « Casey progression » : `#stage` est visible et Casey le traverse.
- **Hero** : à côté de la bulle du titre, un emplacement `<div id="casey-seat">` marque la position assise de Casey (au-dessus de la bulle sur desktop ; sur mobile, Casey reste dans la scène).
- **FAQ** : `<details class="faq-item"><summary>…</summary><div>…</div></details>`. Elle est native, sans JS. Un CSS progressif (`interpolate-size`/`::details-content`) peut adoucir l'ouverture là où le navigateur le supporte.
- **Formulaire** : `<form id="question-form" novalidate>`, qui contient :
  - des radios `name="role"` (valeurs `eleve`/`parent`) ;
  - des radios `name="level"` (valeurs `college`/`lycee`) ;
  - `<textarea name="question">` ;
  - `<button type="submit">` (jamais désactivé) ;
  - `<p id="question-help" hidden>`.
- **Bouton flottant** : `<a id="wa-float" href="#question">`.
- **Scripts** : tous en `defer`, en fin de `<head>`, dans cet ordre :
  1. GSAP `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js` ;
  2. ScrollTrigger `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js` ;
  3. `js/casey.js` ;
  4. `js/contact.js` ;
  5. `js/choreo.js`.
- **Sans JS**, la page est entièrement lisible et chaque élément s'affiche dans son état final. Seule la chorégraphie masque des éléments avant leur entrée, en JS. **Exception : le `h1` n'est jamais masqué** (pour le LCP). Il s'anime depuis un état visible (rebond ou échelle par mot), jamais depuis `opacity: 0`.

### C2. API mascotte (`window.Casey`, `js/casey.js`)

```js
Casey.POSES        // ['sit','idle','walk','point','wave','think','phone','party']
Casey.mount(el)    // injecte le SVG riggé dans el ; idempotent ; retourne le <svg class="casey">
Casey.pose(name, { duration = 0.4 } = {})  // → Promise
Casey.walk(speed)  // speed borné à [0,1]
Casey.face(dir)    // 'left' | 'right'
Casey.celebrate()  // → Promise
```

**Règles d'état** (la chorégraphie s'appuie dessus) :

1. **La pose demandée** est la dernière passée à `pose()`. Le SVG racine porte `data-pose="<pose demandée>"`.
2. **Le dernier appel gagne.** Un nouvel appel à `pose()` interrompt la transition en cours, et la Promise précédente se **résout** immédiatement (elle n'est jamais rejetée).
3. **Poses en boucle** (`idle`, `wave`, `walk`) : la Promise se résout à la fin de la transition d'entrée. La boucle continue ensuite.
4. **Marche** : `walk(s > 0)` affiche le cycle de marche **par-dessus** la pose demandée, sans la modifier, et pose `data-walking="true"`. `walk(0)` revient en douceur (~0,3 s) à la pose demandée.
5. **Fête** : `celebrate()` joue `party` (~1,2 s) puis revient à la pose demandée **à ce moment-là**, y compris si elle a changé pendant la fête. Un `pose()` appelé pendant la fête met à jour la pose demandée, sans couper la fête. La Promise se résout au retour.
6. **Nom inconnu** : `console.warn`, pas d'exception, Promise résolue.
7. **`prefers-reduced-motion: reduce`** est lu **à chaque appel** (pas au chargement) : `walk()` ne fait rien, et `pose()`/`celebrate()` s'appliquent sans transition.
8. Les membres sont des `<g data-part="head|torso|armL|armR|legL|legR|laptop|phone">`. Casey dépend de `gsap` mais **pas** de ScrollTrigger.

### C3. API contact (`window.Contact`, `js/contact.js`)

```js
var Contact = {
  NUMBER: '33609148090',
  buildMessage({ role, level, question }),  // role: 'eleve'|'parent'|null, level: 'college'|'lycee'|null → string
  buildUrl(message),                        // 'https://wa.me/33609148090?text=' + encodeURIComponent(message)
  init(form, { open } = {}),                // open par défaut : u => window.open(u, '_blank') || (location.href = u)
};
```

- **Contraintes de chargement** :
  - déclaration en `var` en tête de script, pour que `window.Contact` existe dans le navigateur ;
  - `if (typeof module !== 'undefined') module.exports = Contact;` pour Node ;
  - auto-init gardé par `typeof document !== 'undefined'` (au `DOMContentLoaded`, si `#question-form` existe) ;
  - lecture des champs via `form.elements`, jamais `FormData`.
- **Message** :
  - ligne 1 : `Bonjour Casey !`, suivi de ` <Rôle> · <Niveau>` selon ce qui est coché (libellés `Élève`/`Parent`, `Collège`/`Lycée`). Le séparateur ` · ` n'apparaît que si les deux sont choisis. Sans aucun choix, la ligne reste `Bonjour Casey !`.
  - ligne 2 : la question, après `trim()` ;
  - ligne 3 : `(envoyé depuis le site)` ;
  - les lignes sont séparées par `\n`.
- **Envoi** :
  - question vide après `trim()` : afficher `#question-help`, ne rien ouvrir ;
  - sinon : appeler `open(url)` puis émettre `document.dispatchEvent(new CustomEvent('question:sent'))`, une seule fois ;
  - `#question-help` est masqué dès un `input` sur la textarea.

### C4. Événements

- `question:sent` : émis par `contact.js`, écouté par `choreo.js`, qui appelle alors `Casey.celebrate()`.

## Ressources partagées

| Ressource | Règle |
|---|---|
| Dépendances du site | GSAP 3.12.5 via cdnjs, ajouté par le socle. **Aucune autre lib.** Pas de `package.json`. |
| Outils hors dépôt | Via `uvx` uniquement, rien n'est installé dans le dépôt : `qrcode` et `opencv-python-headless` (agent 2), `npx -y lighthouse` (agent 3). |
| Réseau | Les tests Chrome chargent GSAP depuis le CDN, donc ils exigent une connexion internet. |
| Ports de dev | `python3 -m http.server <port>` : socle 8000, mascotte 8001, print 8002, chorégraphie 8003. |
| BDD / `.env` / secrets | Aucun. |
| Config de test | `tests/run.sh`, `tests/lib.sh`, `tests/contract.html`, `tests/test_structure.py`, `tests/fixtures/` appartiennent au socle et sont en lecture seule pour les autres. |
| `index.html`, `css/tokens.css`, `css/sections.css` | Propriété du socle en phase 0, puis de l'intégration en phase 2 (retouches minimales, justifiées dans le rapport). |

## Tests

`bash tests/run.sh` lance tout et sort en code ≠ 0 au premier échec. Il exige Node ≥ 21 (pour le glob) et le vérifie.

1. `python3 -m unittest discover -s tests -p 'test_*.py'` : structure de `index.html` (C1).
2. `node --test 'tests/**/*.test.mjs'` : `contact.js` (C3), d'après `tests/fixtures/messages.json`.
3. Pages de test navigateur, via `tests/lib.sh` → `chrome_check <fichier.html> [flags…]`.
   - Chrome headless est lancé avec `--dump-dom --virtual-time-budget=10000`.
   - Il est relancé jusqu'à 3 fois tant que `<pre id="result">` est vide.
   - Le résultat doit valoir `OK` ; sinon il liste les échecs.
   - Pages : `tests/contract.html` (C2 + C3), puis chaque `tests/*/run.sh` trouvé (mascotte, chorégraphie).
   - Les cas reduced-motion passent `--force-prefers-reduced-motion`.

## Phases

- **Phase 0, socle** : l'agent 0 travaille seul.
- **Phase 1, en parallèle** : l'agent 1 (mascotte, qui commence par un spike) et l'agent 2 (print).
- **Phase 2, intégration** : l'agent 3 merge, écrit la chorégraphie et valide.

## Agents

| # | Branche | Fichiers possédés | Mission |
|---|---|---|---|
| 0 · socle | `main` | `index.html`, `css/tokens.css`, `css/sections.css`, `js/contact.js` (complet), stubs `js/casey.js` et `js/choreo.js`, `tests/` (hors sous-dossiers des agents), `.gitignore` | Page complète et statique, styles de l'affiche, formulaire fonctionnel, contrats, stubs et tests de contrat |
| 1 · mascotte | `feat/mascotte` | `js/casey.js`, `css/casey.css`, `dev/`, `tests/casey/` | Spike scroll, puis Casey riggé, 8 poses, marche, règles d'état C2 |
| 2 · print | `feat/print` | `tools/`, `assets/qr.svg`, `affiche/` | QR code vers `SITE_URL`, affiche mise à jour et PDF |
| 3 · chorégraphie | `feat/choreo` | `js/choreo.js`, `tests/choreo/` + retouches de `index.html`/`css/*` | Merge, ScrollTrigger, reduced-motion, validation |

> Note pour l'humain : `/agent check 3` signalera comme « hors périmètre » les fichiers apportés par les merges des agents 1 et 2. C'est attendu.

## Définition de « fini »

- [ ] `bash tests/run.sh` passe sur la branche intégrée. Il inclut `tests/casey/run.sh` et `tests/choreo/run.sh`.
- [ ] Les 6 sections sont dans l'ordre, et la page est lisible sans JS. Preuve : `chrome --headless --disable-javascript --screenshot` aux tailles 375 et 1440.
- [ ] Hors hero, Casey reste dans `#stage` hors de la zone du bouton (desktop et mobile, depuis « Casey progression »). Preuve : tests `pathAt` et captures headless à 375 × 667, 390 × 844 et 1440 × 900, prises à 5 positions de scroll.
- [ ] Casey change de pose dans chaque section et marche pendant le scroll. Preuve : test chorégraphie ; la fluidité est **validée par l'humain**.
- [ ] Reduced-motion : aucune animation de scroll, Casey est statique. Preuve : test lancé avec `--force-prefers-reduced-motion`.
- [ ] Le formulaire produit l'URL exacte de C3 (fixtures) et déclenche `celebrate`. Le test réel d'ouverture de WhatsApp est fait **par l'humain**.
- [ ] `npx -y lighthouse <url> --form-factor=mobile --only-categories=performance,accessibility --chrome-flags=--headless` donne au moins 90 dans chaque catégorie.
- [ ] `assets/qr.svg` se décode exactement en `SITE_URL`, et le PDF de l'affiche tient sur une seule page A4.
- [ ] Test sur un vrai iPhone (Safari) via l'IP locale, **validé par l'humain**.

---

# Chantier 2 · Décors dessinés (2026-10-09)

Spec : `docs/superpowers/specs/2026-10-09-decors-design.md`. **Lis-la en entier.** Elle remplace la trame manga (commits `b9e8692`, `877b2d7`). **En cas de divergence avec la spec (notamment sa section « Livraison »), cette partie fait foi.** Les agents 0 à 3 ci-dessus sont terminés ; leurs prompts sont archivés dans `.agents/archive/`. Ce chantier utilise les agents 4 et 5.

## Entrées humaines (toutes fournies)

| Entrée | Valeur |
|---|---|
| Organisation | Un décor par section, plein fond, texte sur cartes papier, approche A (décor solidaire de la section, sans couche fixe ni parallaxe) |
| Rendu | Couleurs pastel cernées de noir, dessinées à la main en SVG |
| Scènes et aplats | Tableau « Les 6 scènes » de la spec (lieu, bande du haut, bande du bas, couleur) |
| Validation du style | L'humain valide la mise en page et la scène `apprendre` (fin de l'agent 4), puis les 5 autres scènes (fin de l'agent 5). Chaque agent attend un oui clair avant son rapport « terminé ». |
| Mise en ligne | Push sur `origin/main` **par l'orchestrateur, après l'OK de l'humain** (action externe : c'est GitHub Pages). Aucun agent ne pousse. |

## Contrats

### C1 (amendé)

- **Cartes** : le contenu de chaque section est dans un unique `<div class="card">`, seul enfant élément de la `<section>`. Dans le hero, la carte contient le kicker, la bulle, le sous-titre et la flèche ; `#casey-seat` reste dans `.hero-bubble`.
- **Cases** : chaque section déborde de `main` (`margin-inline: calc(50% - 50vw)`). `main` garde `max-width: 640px` : `tests/choreo` le mesure comme colonne interdite à Casey. `html { overflow-x: clip }` empêche le défilement horizontal. Sur un desktop à barre de défilement classique, `50vw` inclut la barre : un décalage d'environ 8 px du décor est accepté.
- **Décors** : portés **uniquement** en arrière-plan CSS de la section, dans `css/sections.css`, dans cet ordre de couches : bande du haut, bande du bas, couche sol (`linear-gradient(var(--floor-<id>) 0 0)` en bas, pleine largeur, sous la bande du bas, pour les écrans de plus de 1600 px), aplat `--decor-<id>`. Aucun élément de décor dans le DOM. Les 12 fichiers sont branchés dès la phase 0 (stubs).
- **Retirés** : la trame du `body`, `.hero-bubble::before` et le détourage du `.kicker`.

### C5. Fichiers de décor (`assets/decors/`)

Testé par `tests/test_decors.py` :
- Noms : `<id>-haut.svg` et `<id>-bas.svg` pour `id` ∈ `hero apprendre infos moi faq question`. Exactement 12 fichiers.
- Racine : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 220" width="1600" height="220">` (haut) ou `0 0 1600 180` / `1600`×`180` (bas). `width`/`height` sont obligatoires (Safari en a besoin pour `background-size: auto <h>`).
- **Interdits** : `<text>`, `<image>`, `<filter>`, `<foreignObject>`, `<script>`, `<style>`, `<pattern>`, dégradés, `<use>`, tout attribut `href`/`xlink:href`, tout attribut `opacity`, `fill-opacity`, `stroke-opacity`, l'attribut `style`.
- **Couleurs** : toute forme fermée (`rect`, `circle`, `ellipse`, `polygon`, `path` fermé par `Z`) porte un `fill` explicite, directement ou hérité d'un `<g>`. Les valeurs sont normalisées par le test (minuscules, `#abc` → `#aabbcc`) et doivent appartenir à C6. `none` est accepté pour `fill` et `stroke`. Les noms de couleur (`white`…) et `currentColor` sont refusés.
- Coordonnées entières : aucun nombre décimal (regex `\d\.\d`).
- Taille : **20 Ko max** par fichier, non compressé.

Relecture humaine (non testé) :
- **Zone essentielle horizontale** : x de 550 à 1050. C'est tout ce qu'on voit à 375 px.
- **Zone visible verticale à 375 px** : haut y de 0 à `N`, bas y de `M` à 180. **`N` et `M` sont mesurés et écrits ici par l'agent 4** (hors de cette zone, la carte cache le dessin) : `N = 88`, `M = 108`. Mesuré à 375 px : carte à 64 px sous le haut de la bande de 160 px, et à 52 px au-dessus du bas de la bande de 120 px, moins les 4 px de son ombre. Sur desktop, la zone visible est plus grande (haut jusqu'à y = 120, bas à partir de y = 80), mais la carte couvre alors x de 504 à 1096 : l'essentiel doit donc tenir dans la zone `N`/`M`.
- **Décor de bord** (x < 550 et x > 1050) : grands aplats, peu de traits, rien de dense. Sur desktop, Casey marche devant.
- La bande du haut est transparente là où rien n'est dessiné ; la bande du bas peint son sol sur toute sa largeur, de la couleur `--floor-<id>`.
- **Ligne de sol** : le sol de la bande du bas est un rectangle qui commence à **y = 130** (trait de 3 en haut, il descend sous 180), par exemple `<rect x="-10" y="130" width="1620" height="60" fill="<floor>"/>`. La couche sol du CSS reprend ces proportions au-delà de 1600 px.

### C6. Guide de style des décors

- Trait : `stroke="#111" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"` (posé sur un `<g>` englobant). Détails intérieurs : `stroke-width="2"`.
- Perspective frontale : murs de face, sol en bande horizontale, aucune fuite en diagonale.
- Formes simples et arrondies (`rx` sur les rectangles), un peu de « main levée » permise par de légers décalages, jamais de bruit.
- Accent `#ff4d00` : petites touches seulement (relecture humaine).
- **Palette.** Point de départ ci-dessous ; l'agent 4 la complète **en pensant aux 6 scènes** (cerisier, toit, néons, écran, dos de livres, guirlande…), l'agent 5 peut encore y ajouter une couleur si une scène l'exige, en mettant à jour ce tableau et la constante de `tests/test_decors.py` dans le même commit, avec une ligne de justification dans son rapport.

| Rôle | Hex |
|---|---|
| Encre | `#111111` |
| Papier | `#ffffff` |
| Aplats de section | `#cde8f6` `#ddefe3` `#fff3c9` `#e6e1f5` `#f5e6d3` `#fbe1e3` |
| Bois clair / foncé | `#ebcfa8` `#c99b6b` |
| Vert tableau / plante | `#6e9c82` `#9ccb8f` |
| Gris clair / moyen | `#e9e9ee` `#bfc3cc` |
| Bleu nuit (soir) / ciel soir | `#3d4a7a` `#f7c6a3` |
| Accent | `#ff4d00` |
| Cerisier clair / foncé | `#f6b8c8` `#ee8fa8` |
| Tuile, dos de livre rouge | `#e8907a` |
| Bleu casier, couette, dos de livre | `#a8c8e8` |
| Lumière : lampe, guirlande, néon | `#ffd66b` |
| Lavande : dos de livre, post-it | `#c9bfe8` |

## Ressources partagées

| Ressource | Règle |
|---|---|
| `index.html`, `css/tokens.css`, `css/sections.css`, `tests/test_decors.py`, `tools/capture-decors.sh` | Agent 4, puis agent 5 (retouches minimales, justifiées dans le rapport). |
| `assets/decors/` | Agent 4 (stubs et `apprendre`), puis agent 5 (les 5 autres scènes ; `apprendre-*` en lecture seule). |
| `AGENTS.md` | Agent 4 : C5 (`N`, `M`) et C6. Agent 5 : C6 seulement. |
| `tests/choreo/`, `tests/casey/`, `tests/run.sh`, `tests/lib.sh` | Lecture seule. Captures dans le scratchpad, jamais dans le dépôt. |
| Dépendances | Aucune nouvelle. Pas de `package.json`. Lighthouse via `npx -y lighthouse`. |
| Ports | Agent 4 : 8004. Agent 5 : 8005. |
| BDD / `.env` / secrets | Aucun. |
| Fusion dans `main` | Agent 4 travaille sur `main`. Agent 5 (rôle intégration) ramène `feat/decors-scenes` sur `main` en fast-forward. L'orchestrateur pousse après l'OK humain, puis supprime `feat/decors`. |

## Phases

- **Phase 0** : agent 4. Cases, cartes, stubs, test, script de captures, mesure de `N`/`M`, palette, scène `apprendre`, Lighthouse. Point d'arrêt humain.
- **Phase 1–2** : agent 5. Les 5 autres scènes à la suite, vérifications, point d'arrêt humain, fusion dans `main`.

## Agents

| # | Branche | Fichiers possédés | Mission |
|---|---|---|---|
| 4 · socle décors | `main` | `index.html`, `css/tokens.css`, `css/sections.css`, `tests/test_decors.py`, `tools/capture-decors.sh`, `assets/decors/`, `AGENTS.md` | Mise en page, contrats chiffrés, scène de référence, validation humaine |
| 5 · scènes | `feat/decors-scenes` | `assets/decors/` (hors `apprendre-*`), retouches de `css/*.css`, `index.html`, C6 de `AGENTS.md`, constante palette de `tests/test_decors.py` | 5 scènes dans le style validé, vérifications, validation humaine, fusion |

## Définition de « fini »

- [ ] `bash tests/run.sh` passe sur `main` après la fusion, et `tests/test_decors.py` en fait partie (découvert par `test_*.py`).
- [ ] Les 12 SVG respectent C5 (test) et C6 (test pour la palette, relecture pour le reste).
- [ ] `tools/capture-decors.sh` : chaque section à 375 et 1440 montre son décor avec ses éléments essentiels visibles autour de la carte.
- [ ] `tests/choreo/capture.sh` : aucun défilement horizontal ; Casey reste hors colonne (desktop) et dans `#stage` (mobile).
- [ ] Lighthouse mobile ≥ 90 en performance et en accessibilité (phase 0 et fin de l'agent 5).
- [ ] Style validé par l'humain : `apprendre` et la mise en page (agent 4), les 5 autres scènes (agent 5).
- [ ] Mise en ligne et test iPhone : **par l'humain**, après son OK.

---

# Casey progression (2026-10-09)

Modif bornée, faite par l'orchestrateur sur `feat/casey-progression` (pas d'agent). Elle amende C1 et la checklist « fini » ci-dessus.

- **Barre de progression** : dans `#stage`, l'abscisse de Casey suit l'avancée dans la page, de la gauche (haut de page) jusqu'avant `#wa-float` (bas de page). Elle ne recule jamais quand on descend. Sur desktop, le hero est à part : Casey part de `#casey-seat` et saute au début de la bande.
- **`#stage` sur desktop** : visible, 96 px. `#casey` y fait 60 px de large (87 px de haut). `body` garde `padding-bottom: 96px`.
- **Bulle de pensée** (`#casey-bubble`) : une phrase par section (`Choreo.thoughtFor(id)`), affichée en entrant dans la section, environ 3 s, une seule fois par visite. Elle suit Casey du côté où il reste le plus de place, dans la bande, hors de la zone du bouton. Elle est décorative (`aria-hidden`), et cachée sans JS. En reduced-motion, elle apparaît sans rebond.
- **Tests** : `tests/choreo/choreo.test.html` vérifie la progression, la bande et les bulles. Le budget de temps virtuel de `tests/lib.sh` passe à 20 s pour attendre l'effacement des bulles.

---

# Casey look (piste C, 2026-10-09)

Casey passe du style de l'affiche (tout orange, tête blanche carrée) à un personnage « illustration jeunesse » cohérent avec les décors. Le cadre ne change pas (viewBox `-12 -14 62 90`, pieds à y ≈ 74), ni l'API C2. Les `data-part` restent les mêmes.

- **Couleurs ajoutées** (constantes en tête du SVG de `js/casey.js`) : peau `#f9d5b8`, sweat `#a8c8e8` (col `#cfe0f2`), jean `#3d4a7a`, verres `#eef5fb`, joues `#f6b8c8`, langue `#ee8fa8`, coque de tablette `#c9bfe8`. L'orange `#FF4D00` reste sur la casquette, les cordons, les semelles et l'écran du téléphone.
- **Membres cernés** : jambes et manches sont un trait noir épais doublé d'un trait de couleur (`limb()`), comme les pieds de chaise des décors.
- **Nouvelles clés de visage** (dans `BASE`/`PARTS`, ciblées par classe, pas par `data-part`) : `dot` (`.eyes-dot`, yeux ronds) et `happy` (`.eyes-happy`, yeux rieurs, `wave` et `party`) ; `mouthO` (`.mouth-o`, bouche en « o », `think`) ; `brows` (`.brows`, en `y`), `browL`/`browR` (`.browL`/`.browR`, en rotation, sourcil levé dans `think`). Elles s'ajoutent à `smile`/`open`, et `.blink` englobe les deux types d'yeux.
- **Pivots** : épaules `6.5 32` / `23.5 32`, coudes `2.5 39` / `27.5 39`, yeux `17.75 19.2`, bouche `17.4 26.4`. Les autres sont inchangés.
- **Casey statique de `#moi`** : dessin inline de la pose `wave` (sans `<use>`), même tracé que `js/casey.js`. Les `<defs>` `#stand`/`#head` ont été retirés de `index.html`. L'affiche (`affiche/`) garde l'ancien Casey.
