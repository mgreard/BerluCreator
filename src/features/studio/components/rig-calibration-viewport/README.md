# Rig calibration viewport

Adaptateur UI du calibreur de personnages.

## Responsabilités

- connecter les sélections Pinia au catalogue de rigs;
- adapter les coordonnées du moteur pur `rig-layout` au stage de calibration;
- afficher le corps, la tête, la bouche et les accessoires;
- gérer les gestes, guides et commandes de navigation propres au calibreur.

Les formules de placement ne doivent pas être réimplémentées ici. Toute géométrie partagée avec le viewport global appartient à `rig-layout`. Les contrats de rasterisation appartiennent à `rendering`, et les primitives génériques de zoom/pan à `engine/viewport-navigation`.
