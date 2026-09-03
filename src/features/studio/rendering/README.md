# Studio rendering

Ce module porte uniquement les contrats consommés par les moteurs de rendu du Studio.

- `RenderableLayer` décrit une couche déjà résolue dans l’espace scène.
- Le résolveur de hiérarchie produit ce contrat sans connaître Canvas.
- Le rasterizer Canvas le consomme sans connaître le catalogue de rigs.

La géométrie métier des personnages reste dans `rig-layout`; les interactions et le zoom restent dans les adaptateurs de viewport.
