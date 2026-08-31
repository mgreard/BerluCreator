# AssetLibraryGlobalActions

Groupe d’actions globales du Studio placé au début du header. Il réunit le menu Projet, l’import de sprites et l’ouverture de la calibration des rigs.

Le composant lit la sélection courante de la bibliothèque dans `useAssetStore` afin d’initialiser la modale d’import avec la bonne catégorie et le bon personnage.

## Événements

| Événement         | Charge utile | Description                                   |
| ----------------- | ------------ | --------------------------------------------- |
| `openSettings`    | aucune       | Demande l’ouverture des paramètres du projet. |
| `projectMenuOpen` | `boolean`    | Indique l’ouverture du menu Projet.           |
