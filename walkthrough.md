# Walkthrough — studio simplifié

Le studio repose sur un document unique dont les groupes et calques sont l’unique source de vérité. Un personnage mémorise simultanément un sprite complet et un rig, puis bascule entre les deux sans détruire la configuration inactive.

## Modèle et rendu

- `CharacterGroup` spécialise `EditorGroup` avec `characterKey` et `activeMode: 'full' | 'rig'`.
- Le transform, la visibilité, le verrouillage et le z-index globaux appartiennent au groupe. Les ajustements locaux des calques servent à l’assemblage, mais ne sont plus manipulables séparément dans le viewport.
- `character_full` est une catégorie explicite. Les anciens torses complets ne détournent plus `body`.
- Les assets de personnage portent `{ key, name, form }`; un slot de rig est directement représenté par sa catégorie.
- Le resolver affiche uniquement la configuration active et calcule sa géométrie depuis les dimensions naturelles des images. Passer du complet au rig adapte automatiquement le cadre à leur ratio respectif.
- Plusieurs personnages peuvent posséder le même slot sans collision grâce à la cardinalité appliquée par groupe.

## Interaction simplifiée

- La sidebar droite, la modale de réglages de calque et l’atelier de calibration ont été supprimés.
- Les compositions occupent désormais un panneau droit repliable et redimensionnable, dont la largeur est mémorisée. L’ancienne grande modale a été retirée.
- Les vues sauvegardées sont présentées dans une liste dense avec miniature, nom, date et nombre de calques. Les actions charger et supprimer restent accessibles sur chaque ligne ; charger une vue replie le panneau.
- La sidebar gauche conserve un rail lisible : chaque personnage expose ses catégories (complet, corps, têtes, yeux, bouches, bras et accessoires), puis viennent les catégories de décor.
- Les panneaux personnage utilisent désormais `Card` et toutes les lignes personnage/catégorie utilisent la primitive partagée `NavigationItem`. Les espacements, accents, compteurs, états sélectionnés et comportements clavier ne sont plus dupliqués dans `AssetLibraryPanel`.
- Les couleurs de `ASSET_CATEGORIES` structurent désormais les icônes, compteurs et états actifs de la sidebar sans modifier les comportements de filtrage.
- Un clic sur un asset l’ajoute. Un clic sur une autre variante remplace uniquement le même slot. Un clic sur l’asset déjà rendu le retire.
- Cliquer une pièce de rig dans le viewport sélectionne toujours le personnage entier. Déplacement et redimensionnement utilisent exclusivement son transform global.
- Double-cliquer le sprite ou le rig sélectionné vide la sélection du studio et de la bibliothèque, sans le retirer du viewport.
- Toutes les poignées appliquent une échelle uniforme. Les anciens transforms non uniformes sont normalisés au chargement, dans les snapshots et lors de la migration.
- Le HUD flottant n’expose plus aucun contrôle d’échelle : il affiche seulement l’identité, les dimensions et un bouton supprimer.
- Ce bouton retire un sprite simple, le sprite complet actif ou tous les slots du rig actif. La représentation inactive du personnage reste mémorisée et l’opération est annulable.
- Les assets `desk` sont manipulables comme les autres sprites libres. Le resolver corrige aussi à la volée les anciens bureaux enregistrés avec `isMovable: false`.

## Historique et persistance

- Undo/redo stocke au maximum 50 mutations atomiques `{ label, before, after }` sur les groupes et calques.
- Les gestes de déplacement et redimensionnement sont coalescés en une seule action.
- Les changements de mode, assignations, retraits, transforms, visibilité, verrouillage, ordre et z-index sont annulables.
- La caméra reste persistée mais hors historique.
- Undo/redo et les mutations sont sauvegardés par une file IndexedDB séquentielle. Charger une vue sauvegardée restaure les deux configurations puis vide l’historique.

## Assets

- Chaque nouvelle ouverture de la modale d’import sélectionne par défaut `Personnage complet` (`character_full`) ; le mode squelette et les catégories de décor restent sélectionnables manuellement.
- Les cartes génèrent paresseusement une miniature carrée recadrée sur la masse alpha significative. Les pixels parasites sont ignorés, plusieurs zones séparées restent visibles et l’asset original n’est jamais modifié.
- Les miniatures dérivées sont mises en cache par `blobId`, révoquées après usage et remplacées par l’image originale si le canvas du navigateur est indisponible.
- L’import accepte uniquement PNG, JPEG, WebP et SVG décodables, avec dimensions valides et métadonnées de personnage cohérentes.
- Chaque fichier est traité indépendamment. Les succès quittent immédiatement la file ; les erreurs restent visibles et peuvent être retentées.
- Toutes les Object URLs de prévisualisation sont révoquées au retrait, à la fermeture et au démontage.
- Une suppression est bloquée si une vue sauvegardée référence l’asset. Sinon, la confirmation annonce le nombre de calques et la transaction supprime atomiquement asset, blob et références documentaires.

## Migration et legacy

- Dexie v5 migre les documents, vues sauvegardées et la sauvegarde manuelle v4.
- L’ancien état global du personnage est transféré au groupe Berlu ; les groupes personnalisés deviennent des groupes personnage.
- Les anciens assets `torso` marqués complet deviennent `character_full` ; les autres deviennent `body`.
- Sprite complet et slots sont conservés ensemble, avec sélection du mode d’après la représentation visible.
- Les composants de hiérarchie, réglages, calibration, découpe et formats sans consommateur ont été retirés. `sharp` n’est plus installé.
- Les formats de sauvegarde antérieurs au schéma courant sont refusés ; seuls les `@keyframes` CSS décoratifs subsistent.

## Gates validées

| Contrôle | Commande | Résultat |
| --- | --- | --- |
| TypeScript strict | `pnpm exec vue-tsc -p tsconfig.app.json --noEmit --incremental false` | Succès |
| ESLint sans réécriture | `pnpm exec eslint src vite.config.ts histoire.config.ts` | Succès, 0 avertissement |
| Tests unitaires | `pnpm run test:unit` | 90 fichiers, 374 tests passés |
| Build applicatif | `pnpm run build` | Succès avec Vite 5.4.21 |
| Build Histoire | `pnpm run story:build` | 68 stories, 176 variantes |

Le build applicatif signale encore un chunk principal supérieur à 500 kB. Histoire 0.17 émet aussi ses avertissements historiques de bundle/CJS, sans faire échouer le build. La vérification visuelle locale n’a pas pu être automatisée dans cette session faute de navigateur connecté.
