statut: terminé

## Fait
- Tests d'abord (rouges puis verts) : `tests/test_structure.py` (C1), `tests/fixtures/messages.json` (10 cas), `tests/contact.test.mjs`, `tests/lib.sh`, `tests/contract.html` (C2 + C3), `tests/run.sh`.
- `js/contact.js` complet (C3). Stubs `js/casey.js` (SVG autonome à 8 `data-part`, `pose` ne change que `data-pose`) et `js/choreo.js` (mount + `pose('idle')`).
- `index.html` complet et statique (6 sections, FAQ de 5 questions, formulaire, `#stage`, `#wa-float`, favicon SVG, Open Graph), `css/tokens.css`, `css/sections.css`.
- Captures headless à 375 et 1440 px, avec et sans JS : mise en page vérifiée à l'œil.

## Tests
`bash tests/run.sh` → vert (unittest, 24 tests Node, `contract.html`).

## Dépendances
GSAP 3.12.5 et ScrollTrigger via cdnjs, dans `index.html`. Aucune autre lib. Les polices Google Fonts sont chargées par `<link>` dans `index.html` (et non `@import` dans `tokens.css`, pour éviter une chaîne bloquante).

## Hors périmètre
Aucun.

## Vigilance
- Chrome headless a une fenêtre minimale d'environ 500 px : `--window-size=375` rogne la capture sans changer la mise en page. Pour tester le mobile, utiliser une iframe de 375 px ou l'émulation d'appareil.
- `#casey-seat` est un repère de 72×2 px posé sur le bord haut de la bulle du hero. Il est rendu aussi sur mobile (l'agent 3 décide de ne pas s'en servir).
- La section `moi` contient un Casey SVG statique (via `<use>`). L'agent 3 devra le masquer quand le Casey fixe est monté, sinon il y aura deux Casey.
- `css/casey.css` (agent 1) n'est pas lié dans `index.html` : à ajouter à l'intégration.
- Les stickers portent leur inclinaison dans `--tilt` (`transform: rotate(var(--tilt))`). Les chemins `data-anim="draw"` n'ont pas de `pathLength` : utiliser `getTotalLength()`.
- `#question-help` ne doit pas recevoir de `display` en CSS, sinon l'attribut `hidden` cesse de marcher.
- L'orange d'accent `#FF4D00` sur blanc fait environ 3,4:1 : il est réservé aux grands textes et aux décors. Texte noir sur fond orange pour le bouton.
- Pas de `og:image` (aucun visuel existant). Pas de SRI sur les scripts CDN : l'ordre et les URLs de C1 sont respectés, et l'ajout de `integrity` reste possible plus tard.
- Choix de contenu non fournis par la spec : titres de section « Au programme », « Des questions ? », « Pose ta question ».
- Non vérifié : Lighthouse, iPhone réel.

## Questions
Aucune.
