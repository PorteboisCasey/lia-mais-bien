# Site « L'IA, mais bien » — design

Date : 2026-10-09 · Statut : à valider

## 1. Objectif

Une affiche est collée dans la rue à Marseille. Un passant (élève ou parent) scanne le QR code et arrive sur un site **mobile, très animé**, où la mascotte Casey se balade pendant le scroll. En moins d'une minute, il comprend l'offre et envoie sa question sur WhatsApp.

**Critère de succès :** depuis un iPhone en 4G, la page est interactive en moins de 3 s, l'animation reste fluide au scroll, et la question arrive dans WhatsApp au 06 09 14 80 90, déjà classée (élève/parent, collège/lycée).

## 2. Décisions validées

| Sujet | Décision |
|---|---|
| Public | Universel : élèves et parents, de la 6e à la Terminale (collégiens + lycéens) |
| Tarif | 30 € la séance. **Pas** de séance découverte |
| Lieu | À domicile (Marseille) ou en visio |
| Contact | WhatsApp pré-rempli vers `+33609148090`, numéro affiché en clair |
| Formulaire | Je suis : élève / parent · Niveau : collège / lycée · question libre |
| Hébergement | GitHub Pages |
| Style | Identité de l'affiche (`affiche/affiche.html`) : `--ink #111`, `--accent #FF4D00`, Lilita One / Archivo / Gochi Hand, bordures épaisses, ombres décalées, stickers inclinés |
| Animation | GSAP 3 + ScrollTrigger via CDN (cdnjs, version figée), sans build |
| Exclus | Mini-jeux, blog, prise de RDV/paiement en ligne, multi-pages |

## 3. Expérience

Une seule page en scrollytelling. **Casey** est fixé à l'écran (`position: fixed`) et se déplace selon la progression du scroll :

- **Desktop :** Casey descend en zigzag d'un bord à l'autre, en restant toujours à côté du contenu de la section active, jamais par-dessus le texte.
- **Mobile :** Casey, plus petit, marche de gauche à droite dans une bande en bas de l'écran (environ 90 px), au-dessus du bouton flottant.
- **Marche :** les jambes et les bras se balancent proportionnellement à la vitesse de scroll. Quand le scroll s'arrête depuis environ 300 ms, Casey passe en pose d'attente (respiration, regard). Il se retourne selon le sens du scroll.
- **Poses par section :** voir le tableau ci-dessous. Le passage d'une pose à l'autre est interpolé.

| # | Section (`id`) | Contenu | Animation | Pose de Casey |
|---|---|---|---|---|
| 1 | `hero` | « **Tout le monde** utilise déjà l'IA. **Autant l'utiliser bien.** » + sous-titre « Des séances particulières pour collégiens et lycéens, avec quelqu'un dont c'est le métier. » | Titre mot par mot, trait ondulé dessiné, éclats « shine », flèche « scrolle » qui rebondit | `sit` sur la bulle du titre, salue |
| 2 | `apprendre` | Les 3 promesses de l'affiche | Au scroll, chaque case se coche (trait orange dessiné via `stroke-dashoffset`) | `point` vers la ligne active |
| 3 | `infos` | Stickers : « De la 6e à la Terminale » · « 30 € la séance » · « À domicile ou en visio · Marseille » | Les stickers tombent, rebondissent et gardent leur inclinaison | `walk` puis `idle` |
| 4 | `moi` | « C'est moi ! » Casey, alternant en IA dans un grand groupe marseillais + numéro | Bulle « C'est moi ! » manuscrite qui pop | `wave` |
| 5 | `faq` | Accordéon (voir §5) | Ouverture/fermeture fluide | `think` (main au menton) |
| 6 | `question` | Formulaire → WhatsApp | Choix en gros boutons-stickers | `phone` (tient un téléphone), puis `party` à l'envoi |

**Partout :** bouton WhatsApp flottant (pastille orange avec ombre noire) qui renvoie à `#question`.

**Accessibilité :** avec `prefers-reduced-motion: reduce`, Casey reste statique dans chaque section (pose fixe, sans marche) et les apparitions sont instantanées. Le contenu reste entièrement lisible sans JS. Casey est en `aria-hidden`, les contrastes respectent AA et les cibles tactiles font au moins 44 px.

## 4. Architecture

Fichiers séparés sans build. **Le découpage des fichiers, les contrats (C1–C4) et les agents sont définis dans `AGENTS.md`, qui fait foi.** Sur mobile, Casey marche dans une scène opaque de 96 px en bas d'écran (`#stage`), avec le bouton WhatsApp à droite.

### Rig de Casey

Il est reconstruit à partir des SVG de l'affiche (`#head`, `#sit`, `#stand`) et découpé en groupes articulés : `head`, `torso`, `armL`, `armR`, `legL`, `legR`, `laptop`/`phone` (accessoires masquables). Chaque membre pivote autour de son articulation (`transform-origin` en coordonnées SVG). Les poses sont des jeux d'angles et de translations interpolés par GSAP. Le trait, la casquette orange, les lunettes et les épis restent identiques à l'affiche.

## 5. Contenu

**FAQ** (réponses proposées, à valider) :

- **C'est pas de la triche ?** Non. Justement, on apprend à s'en servir pour comprendre un cours, pas pour faire le devoir à ta place.
- **Il faut un ordi ?** Un ordi ou une tablette, c'est mieux. En visio, il suffit d'avoir une connexion.
- **Ça se passe comment, une séance ?** On part de tes cours et de tes devoirs du moment, on pratique ensemble et tu repars avec des méthodes réutilisables.
- **Combien ça coûte ?** 30 € la séance, à domicile à Marseille ou en visio.
- **Quels niveaux ?** De la 6e à la Terminale.

**Message WhatsApp généré :**

```
Bonjour Casey ! [Élève|Parent] · [Collège|Lycée]
<question>
(envoyé depuis le site)
```

Encodé avec `encodeURIComponent`, puis ouvert via `https://wa.me/33609148090?text=…`. Si la question est vide, un message d'aide s'affiche (le bouton n'est jamais désactivé, formulaire `novalidate`). Les deux choix sont facultatifs : sans sélection, la ligne correspondante est omise.

## 6. QR code et affiche (agent 2 · print)

- QR code SVG noir sur blanc, correction d'erreur niveau M, pointant vers l'URL GitHub Pages définitive. Il est généré une seule fois, avec un script Python et le paquet `qrcode` (seule dépendance, hors du site).
- Mise à jour de `affiche/affiche.html` :
  - « Votre ado » devient « Tout le monde ».
  - Sous-titre « collégiens et lycéens ».
  - Les stickers reprennent les valeurs du §3.
  - L'étoile « séance découverte » est remplacée par le QR code avec « Scanne & pose ta question ».
  - Le PDF est régénéré via Chrome headless.

## 7. Découpage en agents

Voir `AGENTS.md` : 0 socle → 1 mascotte ∥ 2 print → 3 chorégraphie/intégration.

## 8. Vérification

- `python3 -m http.server` en local, puis test dans Chrome desktop et sur un vrai iPhone (Safari) via l'IP locale.
- Checklist :
  - les 6 poses s'affichent ;
  - la marche suit le scroll, dans les deux sens ;
  - Casey ne masque jamais le texte (mobile et desktop) ;
  - le lien WhatsApp est correct (avec accents, emoji, retours à la ligne) ;
  - le mode reduced-motion fonctionne ;
  - la page est lisible sans JS ;
  - Lighthouse mobile ≥ 90 en performance et en accessibilité.
- Le QR code imprimé est scanné avec iPhone et Android.

## 9. Points ouverts

- Pseudo GitHub et nom du dépôt : ils déterminent l'URL du QR code et doivent être fixés avant de générer le QR.
