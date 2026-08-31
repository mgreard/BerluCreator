# AssetLibraryPanel

Explorateur unifié de la bibliothèque du Studio. Le panneau regroupe la recherche, les familles de sprites, les filtres contextuels et la grille d’assets dans une seule surface. Les actions globales Projet, Importer et Rigs vivent dans `AssetLibraryGlobalActions`, au début du header Studio.

## Utilisation

```vue
<ResizableSidebar v-model:open="libraryOpen" side="left" :default-width="400">
  <AssetLibraryPanel v-model:open="libraryOpen" />
</ResizableSidebar>
```

## Modèles

| Modèle      | Type              | Défaut            | Description                     |
| ----------- | ----------------- | ----------------- | ------------------------------- |
| `open`      | `boolean`         | `true`            | État déplié de la bibliothèque. |
| `selection` | `ActiveSelection` | `{ type: 'all' }` | Famille et filtre actifs.       |

La largeur n’est pas gérée par ce composant : elle appartient à `ResizableSidebar`. Les sous-catégories utilisent une grille sur deux colonnes sans défilement horizontal. Sous 1100 px, le panneau remplit l’espace Bibliothèque du layout compact.
