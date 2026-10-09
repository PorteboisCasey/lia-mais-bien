statut: terminé
## Fait
- `tools/make_qr.py` (qrcode, correction M, SVG à viewBox sans width/height, #111 sur fond #fff, marge 4 modules) + `tools/test_make_qr.py`.
- `assets/qr.svg` généré pour `https://porteboiscasey.github.io/lia-mais-bien/`.
- `affiche/affiche.html` : « Tout le monde », sous-titre collégiens et lycéens, 3 stickers du §3, QR inliné (cadre 34 mm, ~32 mm utiles) avec légende Gochi Hand orange « Scanne & pose ta question ». Languettes inchangées.
- `affiche/affiche-cours-ia.pdf` régénéré via Chrome headless.
## Tests
- `uvx --with qrcode python -m unittest discover -s tools` : 4 tests OK.
- Décodage `assets/qr.svg` (rendu Chrome → PNG → cv2.QRCodeDetector) : texte == SITE_URL exact.
- PDF : `qpdf --show-npages` = 1, A4 ; capture `pdftocairo -r 60` vérifiée à l'œil, rien ne déborde ; QR du PDF (rendu à 300 dpi) décodé == SITE_URL exact.
## Dépendances
Aucune dans le dépôt (outils via `uvx` : qrcode, opencv-python-headless).
## Hors périmètre
Vide.
## Vigilance
- L'étoile « séance découverte » est supprimée (remplacée par le QR) : plus de [PRIX] sur l'affiche.
- Un QR trop grand pousserait les languettes hors page (`.page` en overflow hidden) : revérifier si le contenu change.
- Test de scan réel iPhone/Android à faire par l'humain (spec §8).
## Questions
Aucune.
