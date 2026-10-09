---
branch: feat/print
aliases: [P, print, affiche, qr]
role: worker
depends: [0]
owns: [tools/, assets/qr.svg, affiche/]
model: sonnet
---
Tu es l'agent **print**. Tu génères le QR code qui renvoie vers le site et tu mets l'affiche papier à jour.

**Lis `AGENTS.md` en entier (surtout `SITE_URL`) et la spec §6.**

## Fichiers possédés

- `tools/`
- `assets/qr.svg`
- `affiche/`

## Mission

### 1. Script de génération, test d'abord

Crée `tools/test_make_qr.py` (unittest) pour `tools/make_qr.py` : le SVG produit a un `viewBox`, utilise `#111` sur fond blanc et comporte une marge de 4 modules.

Lance-le avec :

```
uvx --with qrcode python -m unittest discover -s tools
```

### 2. QR code

Écris `tools/make_qr.py <url> <sortie>` : correction d'erreur M, SVG vectoriel sans dimensions fixes.

Génère `assets/qr.svg` avec la `SITE_URL` exacte d'AGENTS.md, puis vérifie-le par décodage :

1. Rends le SVG en PNG avec Chrome headless `--screenshot` (page HTML temporaire placée dans le scratchpad, pas dans le dépôt).
2. Lance `uvx --with opencv-python-headless python -c …` avec `cv2.QRCodeDetector().detectAndDecode`.
3. Le texte décodé doit valoir `SITE_URL` **exactement**.

### 3. Affiche

Modifie `affiche/affiche.html` :

- remplace « Votre ado » par « Tout le monde » ;
- sous-titre : « Des séances particulières pour collégiens et lycéens, avec quelqu'un dont c'est le métier. » ;
- stickers : « De la 6e à la Terminale » · « 30 € la séance » · « À domicile ou en visio · Marseille » ;
- l'étoile « séance découverte » est remplacée par le QR code (inliné, au moins 30 mm de côté), avec la légende Gochi Hand orange « Scanne & pose ta question » ;
- les languettes restent inchangées.

### 4. PDF

Régénère le PDF :

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-pdf-header-footer --print-to-pdf=affiche/affiche-cours-ia.pdf affiche/affiche.html
```

Vérifie ensuite :

- le PDF fait **1 page**, avec `pdfinfo` ou `qpdf --show-npages` ;
- rien ne déborde, d'après une capture PNG via `pdftocairo -png -r 60` que tu regardes ;
- le QR **rendu dans le PDF** se décode encore exactement en `SITE_URL` (même méthode que l'étape 2).

## Interdits

- Ne touche à aucun fichier du site.
- N'invente jamais d'URL.
- N'installe rien dans le dépôt : les outils passent uniquement par `uvx`.

## Critère de fin

- Les tests de `tools/` sont verts.
- `assets/qr.svg` et le QR du PDF se décodent tous deux exactement en `SITE_URL`.
- Le PDF tient sur une seule page A4.
