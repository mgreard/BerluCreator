# DepthOfFieldOverlay

Overlay d’édition de la profondeur de champ. Il affiche une limite de netteté horizontale
déplaçable, ainsi que les réglages d’intensité et de douceur.

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
