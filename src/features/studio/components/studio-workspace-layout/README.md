# StudioWorkspaceLayout

Coquille structurelle du Studio. Elle place les régions persistantes dans le flux
normal afin qu’elles ne recouvrent jamais le viewport.

## Régions

- `header` : commandes globales ;
- `left` : bibliothèque d’assets ;
- slot par défaut : viewport ;
- `right` : compositions ou calibrage ;
- `footer` : commandes liées à la sélection.

Les slots sont facultatifs à l’exception du viewport. Les régions latérales doivent
gérer leur largeur ou utiliser `ResizableSidebar`.

Sous 1100 px, `v-model:compact-pane` choisit un seul espace visible parmi
`library`, `studio` et `inspector`. L’inspecteur est désactivé lorsqu’aucun
contenu droit n’est fourni.

## Invariants

- surfaces opaques avec tokens sémantiques ;
- aucune région persistante positionnée en absolu ;
- cellule centrale en `min-w-0 min-h-0` ;
- overlays réservés aux interactions spatiales du canvas.
