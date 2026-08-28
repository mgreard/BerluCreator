# RigCalibrationPanel

Panneau latéral complet de calibration des rigs (Catalogue v3). Il structure la calibration en trois sections ordonnées :

1. **Corps et rig** : Choix du corps racine, définition comme rig par défaut pour le personnage, et duplication complète de configuration vers un autre rig via modale dédiée (`DuplicateRigModal`).
2. **Catégorie et sprite** : Sélection de la catégorie configurable (hors corps), interrupteur d'activation/désactivation de catégorie (permettant par exemple d'exclure les bras sur un buste tout en préservant l'état dormant), sélection du sprite, switch de compatibilité et bouton pour définir l'élément comme référence par défaut (créant le template de la catégorie).
3. **Placement sur le corps** :
   - Badges d'état d'héritage dynamiques (`Template de la catégorie`, `Valeurs héritées de la catégorie`, `Valeurs personnalisées`).
   - Contrôles numériques (`X`, `Y`, `Échelle`, `Rotation`, `Z-index`) accompagnés de boutons de duplication atomique (`IconButton` `content_copy`) permettant d'appliquer une valeur spécifique à tous les éléments de la catégorie en 1 clic.
   - Actions rapides : Suggestion automatique (`Auto`), réinitialisation de surcharge (`Réinitialiser`) et enregistrement (`Enregistrer`).

Le composant ne se superpose jamais au canvas : il est intégré dans une colonne latérale dédiée adjacente au viewport.
