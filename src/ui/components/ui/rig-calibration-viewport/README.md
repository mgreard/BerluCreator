# RigCalibrationViewport

Composant UI agnostique de prévisualisation et calibration géométrique Corps + Tête en temps réel.

## Fonctionnalités

- Rendu centré du corps statique et de la tête positionnée relativement à l'origine du corps.
- Visualisation et manipulation directe par glisser-déposer de l'origine du corps (`bodyOrigin`).
- Déplacement direct de la tête sans snapping, avec infobulle de coordonnées relatives en temps réel.
- Navigation complète du viewport : Zoom avant/arrière, zoom à la molette, ajustement automatique (`fit`), réinitialisation et déplacement panoramique (pan via clic molette ou Espace + glisser).
- Support des ajustements fins au clavier (touches fléchées : ±1px, Shift + flèches : ±10px).
