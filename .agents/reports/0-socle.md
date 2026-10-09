statut: bloqué

## Fait
Rien. Arrêt à l'étape préalable : `SITE_URL` vaut encore « À FOURNIR PAR L'HUMAIN AVANT LA PHASE 0 » dans AGENTS.md.

## Tests
Aucun lancé.

## Dépendances
Aucune.

## Hors périmètre
Aucun fichier touché hors `.agents/reports/0-socle.md`.

## Vigilance
Les agents 1 et 2 dépendent du socle : ne pas les lancer avant que la phase 0 soit terminée. L'agent 2 a besoin de `SITE_URL` pour le QR code.

## Questions
- Quelle est la valeur de `SITE_URL` (`https://<pseudo>.github.io/<repo>/`) ? Une fois AGENTS.md mis à jour, relancer `/agent 0`.
