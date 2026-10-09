---
branch: main
aliases: [S, socle]
role: setup
depends: []
owns: [index.html, css/tokens.css, css/sections.css, js/, tests/run.sh, tests/lib.sh, tests/contract.html, tests/test_structure.py, tests/fixtures/, tests/contact.test.mjs, .gitignore, AGENTS.md, .agents/]
model: sonnet
---
Tu es l'agent **socle** (phase 0) du site « L'IA, mais bien ». Tu poses la page, les styles, le formulaire, les contrats et les tests, sur lesquels les autres agents travailleront en parallèle.

**Lis `AGENTS.md` en entier (il fait foi), puis la spec `docs/superpowers/specs/2026-10-09-site-lia-mais-bien-design.md`, puis `affiche/affiche.html`.**

**Étape préalable** : si `SITE_URL` dans AGENTS.md vaut encore « À FOURNIR », arrête-toi avec le statut `bloqué` et demande-la à l'humain.

## Fichiers possédés

- `index.html`
- `css/tokens.css`, `css/sections.css`
- `js/contact.js` (complet)
- `js/casey.js`, `js/choreo.js` (en stubs seulement)
- `tests/run.sh`, `tests/lib.sh`, `tests/contract.html`, `tests/test_structure.py`, `tests/fixtures/`, `tests/contact.test.mjs`
- `.gitignore`

## Mission

### 1. Tests d'abord (rouges, puis verts)

- **`tests/test_structure.py`** (unittest et `html.parser`, stdlib) couvre tout C1 :
  - l'ordre, les `id` et les `data-pose` des sections ;
  - les 6 valeurs de `data-anim` ;
  - `#casey`, `#stage` et `#casey-seat` ;
  - au moins 5 éléments `details.faq-item` ;
  - le formulaire : `novalidate`, les champs et leurs valeurs, aucun `required`, aucun bouton `disabled` ;
  - `#wa-float` ;
  - les URLs exactes et l'ordre des 5 scripts `defer` ;
  - `lang="fr"`, la balise viewport ;
  - le fait que le `h1` ne porte aucun style inline masquant.
- **`tests/fixtures/messages.json`** : couvre le format exact de C3.
  - Les 4 combinaisons de choix.
  - Une question contenant accents, apostrophes, emoji, `&`, `#`, `?`, `+` et retours à la ligne.
  - Une question entourée d'espaces.
  - Une question vide.
  - Le numéro réel n'est **pas** anonymisé.
- **`tests/contact.test.mjs`** (`node:test` et `createRequire`) :
  - vérifie les fixtures de `buildMessage` et `buildUrl` ;
  - teste `Contact.init(fakeForm, { open })` avec un faux formulaire écrit à la main (objets `elements`, `addEventListener` et `document` factice installé sur `globalThis` le temps du test) ;
  - vide : l'aide s'affiche, `open` n'est pas appelé ;
  - valide : `open` reçoit l'URL exacte et un seul `question:sent` est émis ;
  - un `input` sur la textarea masque l'aide.
- **`tests/lib.sh`** : définit `chrome_check <html> [flags…]`.
  - Chemin de Chrome : `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
  - Lance `--headless=new --disable-gpu --virtual-time-budget=10000 --dump-dom "file://…"` en ajoutant les flags passés.
  - Extrait le contenu de `<pre id="result">` et relance jusqu'à 3 fois s'il est vide.
  - Échoue si le résultat ne vaut pas `OK`, en affichant les lignes d'échec.
- **`tests/contract.html`** :
  - charge GSAP, ScrollTrigger, `../js/casey.js` et `../js/contact.js` ;
  - vérifie C2 : présence des méthodes, `POSES` exact, `mount` qui retourne un `svg.casey` avec les 8 `data-part`, `mount` idempotent, `pose('inconnu')` qui ne lève pas d'exception et dont la Promise se résout ;
  - vérifie C3 : fonctions présentes et `NUMBER` ;
  - écrit `OK` ou les échecs dans `<pre id="result">`.
- **`tests/run.sh`**, avec `set -e` :
  - vérifie Node ≥ 21 ;
  - lance unittest, puis `node --test 'tests/**/*.test.mjs'`, puis `chrome_check tests/contract.html` ;
  - lance enfin chaque `tests/*/run.sh` trouvé.

### 2. JS

- **`js/contact.js`** : implémentation **complète** de C3, en respectant à la lettre les contraintes de chargement (`var`, export Node, auto-init gardé, `form.elements`).
- **`js/casey.js`** (stub) :
  - `mount` injecte un `svg.casey` statique copié de `#stand` dans l'affiche, découpé en 8 `<g data-part>` (`laptop` et `phone` vides et masqués), avec `data-pose` ;
  - `pose` met à jour `data-pose` et retourne `Promise.resolve()` ;
  - les autres méthodes ne font rien (no-op), et `celebrate` résout sa Promise.
- **`js/choreo.js`** (stub) : `Casey.mount(#casey)` puis `Casey.pose('idle')`.

### 3. `index.html` complet et statique

Il reprend tout le contenu de la spec (§3, §5) et respecte C1 :

- **Hero** :
  - titre « Tout le monde utilise déjà l'IA. Autant l'utiliser bien. » (en `.w`) ;
  - trait ondulé (`draw`) et éclats (`shine`) repris de l'affiche ;
  - sous-titre ;
  - flèche « scrolle » (`hint`) ;
  - `#casey-seat`.
- **Promesses** : les 3 promesses, avec des coches SVG (`draw`).
- **Stickers** : les 3 stickers (`drop`).
- **« C'est moi ! »** : la bulle (`pop`), Casey en `<svg>` statique, le métier et le numéro cliquable `tel:+33609148090`.
- **FAQ** : en `<details>`.
- **Formulaire** : les choix sont des radios stylés en boutons-stickers (accessibles au clavier, focus visible), la textarea, le bouton « Envoyer sur WhatsApp » et le texte d'aide.
- **`#stage`** et **`#wa-float`**.
- **`<head>`** : `<title>`, meta description, Open Graph et favicon SVG (la tête de Casey).

### 4. CSS

- **`tokens.css`** :
  - variables de l'affiche ;
  - polices Google Fonts : Lilita One, Archivo 600/700/800, Gochi Hand, en `display=swap` ;
  - composants `.bubble`, `.sticker`, `.phone`, `.check`, `.btn-sticker` ;
  - unités web uniquement : `rem`, `px`, `clamp`. Pas de `mm`.
- **`sections.css`** :
  - mobile d'abord, colonne de 640 px max ;
  - `#stage` : 96 px fixe en bas, opaque, bordure pointillée, `body { padding-bottom: 96px }`, `#wa-float` à droite dans la bande ;
  - ≥ 1024 px : `#stage` masqué, gouttières latérales d'environ 140 px réservées ;
  - la FAQ s'ouvre de façon progressivement fluide ;
  - **aucun** `opacity: 0` ni contenu masqué par défaut.

### 5. Vérifier, puis commiter

- `bash tests/run.sh` doit passer au vert.
- Lance `python3 -m http.server 8000` et prends des captures headless à 375 px et 1440 px, avec et sans JS. Regarde-les.
- Commite tout sur `main`, y compris `AGENTS.md`, `.agents/` et la spec. Message court en français.

## Interdits

- Aucune lib hors GSAP via le CDN.
- Ne pas animer : c'est le rôle de l'agent 3.
- Ne pas rigger Casey : c'est le rôle de l'agent 1.
- En cas de contradiction entre la spec et AGENTS.md, **AGENTS.md gagne**. Note-la dans ton rapport sans t'arrêter. Arrête-toi seulement si AGENTS.md se contredit lui-même.

## Critère de fin

`bash tests/run.sh` est vert sur `main`, la page complète est lisible sans JS, et tout est commité.
