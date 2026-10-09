# Décors dessinés par section

Date : 2026-10-09 · Branche : `feat/decors` · Remplace la trame manga (commits `b9e8692`, `877b2d7`).

## Intention

L'utilisateur veut un fond « cartoon anime ». La trame de points noir et blanc ne correspondait pas : il veut un **décor dessiné**, en **couleurs pastel**, **différent pour chaque section**, que Casey traverse en marchant.

Critères de réussite :
- chaque section se lit comme une case de manga avec son propre lieu ;
- le texte reste aussi lisible qu'aujourd'hui (il n'est jamais posé sur un dessin) ;
- la page reste complète sans JS ;
- Lighthouse mobile ≥ 90 en performance et en accessibilité ;
- le trajet de Casey et la chorégraphie ne changent pas.

Choix validés par l'utilisateur : un décor par section, plein fond avec texte sur cartes, couleurs pastel, dessins faits à la main en SVG (pas d'images fournies), décor solidaire de la section (approche A, sans couche fixe ni parallaxe).

## Structure

### Cases

Chaque `<section>` devient une case pleine largeur :
- elle déborde de `main` avec `margin-inline: calc(50% - 50vw)`, et son padding horizontal recentre le contenu ;
- `main` garde son `max-width: 640px`. **C'est volontaire** : le test de chorégraphie mesure `main` pour vérifier que Casey ne marche pas sur la colonne ;
- un cadre noir de `calc(var(--line) * 1.5)` et une gouttière blanche de 12 px séparent les cases, comme sur une planche ;
- `html { overflow-x: clip }` empêche le défilement horizontal dû à la largeur de la barre de défilement (`clip` plutôt que `hidden` : il ne crée pas de conteneur de scroll et ne casse pas ScrollTrigger).

### Cartes

Le contenu de chaque section est enveloppé dans un `<div class="card">` :
- fond `var(--paper)`, bordure `var(--line)` noire, `border-radius: var(--radius)`, ombre `var(--shadow)` ;
- largeur max : celle de la colonne (640 px moins le padding de `main`) ;
- le `#casey-seat` du hero reste au même endroit par rapport à la bulle (il est dans `.hero-bubble`, qui passe dans la carte sans changer de place relative).

La bulle du hero est déjà une carte : dans le hero, `.card` enveloppe la bulle, le sous-titre et la flèche. Si le double cadre (carte + bulle) charge trop sur les captures de l'étape 1, la carte du hero perd sa bordure et son ombre, et garde seulement son fond papier.

### Décor : deux bandes + un aplat

Chaque scène est découpée en deux bandes SVG posées en arrière-plan CSS multiple sur la section :

```css
#apprendre {
  background:
    url(../assets/decors/apprendre-haut.svg) top center / auto var(--band-top) no-repeat,
    url(../assets/decors/apprendre-bas.svg) bottom center / auto var(--band-bottom) no-repeat,
    var(--decor-apprendre);
}
```

- Hauteur fixe, largeur proportionnelle, centrage horizontal : sur mobile on voit le centre de la scène, sur desktop toute la largeur.
- viewBox : **1600 × 220** pour le haut, **1600 × 180** pour le bas (plus large que 1440 pour ne jamais laisser de bord vide).
- À 375 px, la bande du haut s'affiche sur 160 px de haut, donc environ 1160 px de large, dont on ne voit que le centre : environ **500 unités du viewBox**. Les éléments essentiels de chaque scène sont donc dans les 500 unités centrales (x de 550 à 1050) ; le reste est du décor de bord, visible sur desktop.
- Hauteurs : `--band-top` 160 px mobile, 220 px desktop ; `--band-bottom` 120 px mobile, 180 px desktop.
- Le padding vertical de la section laisse voir les bandes : la carte commence sous le haut de la bande du haut (elle peut la chevaucher en partie) et s'arrête au-dessus de la bande du bas.
- Le centre est l'aplat de couleur. La carte se pose dessus.

### Ce qui disparaît

- La trame du `body` : le `body` revient à `background: var(--paper)`.
- `.hero-bubble::before` (lignes de vitesse), son `isolation` et sa règle desktop.
- Le `text-shadow` et le `position: relative` du `.kicker`.

### Ce qui ne change pas

`#casey`, `#stage` (opaque, 96 px, bordure en pointillés), `#wa-float`, `js/*.js`, le formulaire, la FAQ, l'ordre des sections et leurs `data-pose`/`data-anim`, la règle « `h1` jamais masqué ».

## Les 6 scènes

Style commun : trait noir `stroke-width="3"` dans le viewBox (2 à 3 px à l'écran selon la hauteur de bande), aplats pastel sans dégradé ni texture, perspective frontale. L'orange `--accent` n'apparaît qu'en petites touches.

| Section | Lieu | Bande du haut | Bande du bas | Aplat (`--decor-<id>`) |
|---|---|---|---|---|
| `hero` | Devant l'école | Ciel, nuages ronds, toit et horloge de l'école | Grille, trottoir, cerisier sur un côté | `#CDE8F6` |
| `apprendre` | Salle de classe | Tableau vert, fenêtres, horloge | Rangées de tables, sol | `#DDEFE3` |
| `infos` | Couloir | Néons, panneau d'affichage | Casiers alignés, carrelage | `#FFF3C9` |
| `moi` | Bureau (alternance) | Étagère, plante, post-it | Bureau, écran avec du code, chaise | `#E6E1F5` |
| `faq` | CDI / bibliothèque | Rayonnages de livres | Grande table, lampe | `#F5E6D3` |
| `question` | Chambre, le soir | Fenêtre et ciel du soir, guirlande | Lit, téléphone allumé sur le bureau | `#FBE1E3` |

Les couleurs pastel complémentaires (bois, vert du tableau, etc.) sont écrites en dur dans les SVG. Seuls les aplats de fond sont des tokens, car le CSS les utilise.

## Contrats

`AGENTS.md`, C1, gagne deux puces :
- **Cartes** : le contenu de chaque section est dans un unique `<div class="card">`, enfant direct de la section.
- **Décors** : chaque section porte son décor en arrière-plan CSS (`assets/decors/<id>-haut.svg`, `<id>-bas.svg`, aplat `--decor-<id>`). Aucun élément de décor dans le DOM.

Aucun changement de C2, C3, C4.

## Performance

- 12 SVG de **20 Ko max** chacun (non compressés), donc moins de 240 Ko au total, servis compressés par GitHub Pages.
- Les décors ne bloquent pas le rendu et le LCP reste le `h1`.
- Pas de `position: fixed` ni de JS ajoutés : rien de nouveau à peindre pendant le scroll en dehors du défilement normal.

## Tests

- **Nouveau `tests/test_decors.py`** (unittest, stdlib) :
  - chaque section a exactement un enfant direct `div.card` ;
  - chaque `url(...)` de décor trouvée dans `css/sections.css` pointe vers un fichier existant ;
  - chaque fichier de `assets/decors/` fait au plus 20 Ko et est un SVG valide (parsé par `xml.etree`) ;
  - les 12 fichiers attendus existent (`<id>-haut.svg`, `<id>-bas.svg` pour les 6 ids).
- `bash tests/run.sh` reste vert, chorégraphie comprise, avec et sans reduced-motion.
- Captures `tests/choreo/capture.sh` (375×667, 390×844, 1440×900, avec et sans JS), relues à chaque étape.
- `npx -y lighthouse` mobile ≥ 90 en performance et en accessibilité, en local avant le push.
- iPhone réel : validé par l'humain.

## Livraison

Un commit par étape, dans le worktree `.worktrees/feat-decors` :
1. Cases et cartes avec aplats seuls ; trame et rayons retirés ; `test_decors.py` (partie cartes). Validation de la mise en page sur captures.
2. Scène `apprendre` complète. **Point d'arrêt : l'utilisateur valide le style du dessin** avant la suite.
3. Les 5 autres scènes, `test_decors.py` complet, Lighthouse, captures.
4. Merge dans `main` et push (mise en ligne) **seulement après l'OK de l'utilisateur**.

## Hors périmètre

Parallaxe, fondu entre scènes, animation des décors, mise à jour de l'affiche imprimée.
