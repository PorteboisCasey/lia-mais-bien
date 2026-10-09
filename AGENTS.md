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
- **Mascotte** : `<div id="casey" aria-hidden="true"></div>`, enfant direct de `<body>`.
- **Scène mobile** (< 1024 px) : `<div id="stage" aria-hidden="true">`, une bande fixe en bas de **96 px**. Elle est opaque (fond papier) et porte une bordure haute en pointillés, comme la ligne de découpe de l'affiche. Casey y marche. `#wa-float` est posé à droite dans la bande, et la zone de Casey **exclut les 80 px de droite**. Le `body` a un `padding-bottom: 96px`.
- **Desktop** (≥ 1024 px) : contenu centré sur 640 px max. Casey se déplace dans les gouttières latérales, et `#stage` est masqué.
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
- [ ] Hors hero, Casey n'est jamais sur la colonne de contenu (desktop), et il reste dans `#stage` hors de la zone du bouton (mobile). Preuve : tests `pathAt` et captures headless à 375 × 667, 390 × 844 et 1440 × 900, prises à 5 positions de scroll.
- [ ] Casey change de pose dans chaque section et marche pendant le scroll. Preuve : test chorégraphie ; la fluidité est **validée par l'humain**.
- [ ] Reduced-motion : aucune animation de scroll, Casey est statique. Preuve : test lancé avec `--force-prefers-reduced-motion`.
- [ ] Le formulaire produit l'URL exacte de C3 (fixtures) et déclenche `celebrate`. Le test réel d'ouverture de WhatsApp est fait **par l'humain**.
- [ ] `npx -y lighthouse <url> --form-factor=mobile --only-categories=performance,accessibility --chrome-flags=--headless` donne au moins 90 dans chaque catégorie.
- [ ] `assets/qr.svg` se décode exactement en `SITE_URL`, et le PDF de l'affiche tient sur une seule page A4.
- [ ] Test sur un vrai iPhone (Safari) via l'IP locale, **validé par l'humain**.
