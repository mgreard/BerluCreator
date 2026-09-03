# Rig layout

Ce module contient la géométrie pure partagée entre l’aperçu de calibration et la scène du studio.

## Espaces de coordonnées

- Les ancres et offsets de calibration sont exprimés dans l’espace natif de la tête.
- `localUnitScaleX/Y` convertit un pixel natif vers l’espace de sortie.
- Le zoom d’interface n’entre jamais dans ce calcul.
- L’arrondi appartient aux adaptateurs de rendu, pas au moteur.

Le module ne dépend ni de Vue, ni de Pinia, ni du DOM, ni du Canvas.
