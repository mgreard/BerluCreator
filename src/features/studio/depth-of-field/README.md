# DepthOfFieldOverlay

Deux composants complémentaires sans responsabilité de fenêtre :

- `DepthOfFieldOverlay` affiche la limite de netteté spatiale sur le canvas ;
- `DepthOfFieldControls` contient l’activation, l’intensité et la douceur et se compose dans un `Popover`.

Les plans lointains se floutent au-dessus de la limite et les plans proches sous celle-ci.

## Contrat

- `modelValue` contient `enabled`, `focusY`, `feather` et `blurRadius`.
- `focusY` est normalisé entre `0` et `1` dans les coordonnées du plateau.
- `interaction-start` ouvre un geste historisable.
- `change` accompagne chaque prévisualisation.
- `commit` termine le geste avec la valeur finale.

## Accessibilité

La ligne utilise le rôle `slider`, accepte les flèches, `Home` et `End`, et possède une
zone tactile minimale de 44 px. `Shift` avec une flèche utilise un pas de 5 %.

L’overlay est une aide d’édition DOM et n’est jamais dessiné dans les exports.
