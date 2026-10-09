statut: terminé

## Fait
- `js/casey.js` : rig complet et moteur d'état C2 (règles 1 à 8). Il dépend de gsap, pas de ScrollTrigger.
  - Un seul SVG, au trait de l'affiche (`#111` 2.2, casquette `#FF4D00`, lunettes, épis, sourire). Il est découpé en `head` (avec `eyes` et `mouth`), `torso`, `armL`/`armR` (avant-bras `.fore` articulé au coude), `legL`/`legR`, `laptop` et `phone` (masqués par défaut, `phone` est tenu dans la main droite).
  - Trois couches de transformations qui ne se marchent pas dessus : la pose sur les `data-part`, la marche sur des `.swing` internes et `.casey-bob`, la fête et l'orientation sur `.casey-jump` et `.casey-flip`.
  - Les poses sont définies par les **points cibles** du coude et de la main, convertis en angles au chargement (`reach()`). C'est plus lisible et plus facile à retoucher que des angles bruts.
  - La marche est une phase sinusoïdale en boucle, avec une amplitude tweenée. `walk(0)` revient donc en douceur (0,3 s) sans saut. Les bras ne se balancent qu'en `idle`/`walk` : sinon ils gardent la pose (téléphone, réflexion…) pendant que Casey marche.
  - Boucles : respiration en `idle`, salut en `wave`, cycle de marche en `walk`. Clignement aléatoire, sauf en `think`.
- `css/casey.css` : `--casey-size` (72 px par défaut), `overflow: visible`, rendu. Aucun positionnement.
- `tests/casey/casey.test.html` + `tests/casey/run.sh` : écrits d'abord (rouges contre le stub), puis verts. Ils couvrent toute la liste de la mission, plus : transition réelle (pas de saut), éclats pendant la fête, téléphone visible au retour, retour de la jambe au repos après `walk(0)`.
- `dev/spike-scroll.html` : le spike, gardé comme démo. `?auto` déroule un scénario de scroll et écrit ses constats dans `<pre id="result">`.
- `dev/casey.html` : démo pour validation humaine, avec un bouton par pose, un slider de marche, un bouton pour se retourner, `celebrate()` et une galerie des 8 poses. Servie sur **http://localhost:8001/dev/casey.html**.

### Constats du spike (aucun amendement de C2 nécessaire)
Le scénario `?auto` est vert. Il prend la vraie API, pilotée par ScrollTrigger (`onToggle` par section → `pose()`, `onUpdate` → `walk(|getVelocity()| / 1500)` + `face(direction)`, arrêt après 300 ms sans scroll → `walk(0)`) :
- la marche passe par-dessus les poses traversées (`sit`, `point`, `idle`) sans toucher `data-pose` ;
- un lancer brutal déclenche 3 `pose()` en rafale : la dernière section gagne et les 6/6 Promises se résolvent ;
- un scroll pendant la fête ne la coupe pas, et le retour se fait sur la pose de la section courante ;
- `walk()` est appelé à chaque frame de scroll (129 appels dans le scénario). Il sort tout de suite si la vitesse arrondie au centième n'a pas changé, et ne recrée pas inutilement ses tweens.

## Tests
- `bash tests/run.sh` → **Tout est vert** : unittest, 24 tests Node, `contract.html`, `casey.test.html` en passe normale et en passe reduced-motion. Stable sur 3 passes.
- Spike : `"$CHROME" --headless=new --virtual-time-budget=20000 --force-prefers-no-reduced-motion --dump-dom "file://$PWD/dev/spike-scroll.html?auto"` → `OK`.
- Captures headless des 8 poses, de la marche (plusieurs instants) et de `face('left')` : vérifiées à l'œil.

## Dépendances
Aucune ajoutée. gsap 3.12.5 (déjà dans `index.html`).

## Hors périmètre
Aucun.

## Vigilance
- **macOS « Réduire les animations » est activé sur cette machine**, et Chrome (headless comme normal) en hérite. Conséquences :
  - les passes « normales » doivent forcer `--force-prefers-no-reduced-motion`, sinon elles partent dans la branche reduced-motion (`tests/casey/run.sh` le fait) ;
  - sur `index.html`, ton Chrome verra Casey **statique**. C'est le comportement voulu. `dev/casey.html` ignore ce réglage par défaut (case à cocher, ou `?motion=system`).
- **Tests headless en temps virtuel** (`--virtual-time-budget`) : Chrome n'y déclenche **pas** `requestAnimationFrame`, et `scrollTo` n'y émet **pas** d'événement `scroll`. Pour l'agent 3 (`tests/choreo/`) :
  - avant de charger GSAP, remplacer rAF par `setTimeout(cb, 16)` (voir le haut de `dev/spike-scroll.html`) et appeler `gsap.ticker.lagSmoothing(0)` ;
  - après chaque `scrollTo`, faire `document.dispatchEvent(new Event('scroll'))`. ScrollTrigger écoute sur **`document`**, pas sur `window`.
- **Lissage scrub et arrêt de la marche** : avec un `scrub` numérique (ex. `scrub: 0.5`), Casey continue de glisser après l'arrêt du scroll alors que ses jambes s'arrêtent au bout de 300 ms. Il faut soit `scrub: true`, soit un délai d'arrêt au moins égal au lissage, soit une vitesse calculée sur le déplacement réel du tween plutôt que sur `getVelocity()`.
- Attributs utiles, en plus de C2 : `data-face` (`left`/`right`) et `data-walk-speed` (vitesse bornée, arrondie au centième), sur le `<svg>`.
- `Casey` est un singleton : plusieurs `mount()` sur des éléments différents partagent le même état. Pas de galerie de poses différentes sur une même page (la démo utilise des iframes).
- Pendant la fête, `data-pose` garde la pose **demandée** (règle 1), pas `party`.
- `pose('party')` affiche la pose sans saut. Le saut et les éclats animés appartiennent à `celebrate()`.
- Au repos, Casey regarde à droite (visière à droite), comme sur l'affiche. Le bras actif (pointer, saluer, téléphone, réflexion) est `armR`, et `point` pointe vers l'avant : utiliser `face()` pour viser le contenu.
- `css/casey.css` n'est pas lié dans `index.html` : à ajouter à l'intégration (signalé aussi par le socle). Le Casey statique de la section `moi` est à masquer quand le Casey fixe est monté.

## Questions
Aucune. La fluidité est à **valider par l'humain** sur http://localhost:8001/dev/casey.html et http://localhost:8001/dev/spike-scroll.html.
