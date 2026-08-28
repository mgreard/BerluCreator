# Walkthrough — stabilisation du studio

Le studio repose désormais sur un document unique dont les groupes et calques sont l’unique source de vérité. Un personnage peut mémoriser simultanément un sprite complet et un rig, puis basculer entre les deux sans détruire la configuration inactive.

## Modèle et rendu

- `CharacterGroup` spécialise `EditorGroup` avec `characterKey` et `activeMode: 'full' | 'rig'`.
- Le transform, la visibilité, le verrouillage et le z-index globaux appartiennent au groupe. Les calques ne conservent que leur transform local.
- `character_full` est une catégorie explicite. Les anciens torses complets ne détournent plus `body`.
- Les assets de personnage portent `{ key, name, form }`; un slot de rig est directement représenté par sa catégorie.
- Le resolver affiche uniquement la configuration active. La hiérarchie conserve et expose les deux configurations, y compris les calques masqués, inactifs ou dont l’asset manque.
- Plusieurs personnages peuvent posséder le même slot sans collision grâce à la cardinalité appliquée par groupe.

## Historique et persistance

- Undo/redo stocke au maximum 50 mutations atomiques `{ label, before, after }` sur les groupes et calques.
- Les gestes de déplacement et redimensionnement sont coalescés en une seule action.
- Les changements de mode, assignations, retraits, transforms, réglages, visibilité, verrouillage, ordre et z-index sont annulables.
- La caméra reste persistée mais hors historique.
- Undo/redo et les mutations sont sauvegardés par une file IndexedDB séquentielle. Charger une vue sauvegardée restaure les deux configurations puis vide l’historique.

## Assets

- L’import accepte uniquement PNG, JPEG, WebP et SVG décodables, avec dimensions valides et métadonnées de personnage cohérentes.
- Chaque fichier est traité indépendamment. Les succès quittent immédiatement la file; les erreurs restent visibles et peuvent être retentées.
- Si l’assignation échoue après la création d’un asset, son asset et son blob sont supprimés avant le retry.
- Toutes les Object URLs de prévisualisation sont révoquées au retrait, à la fermeture et au démontage.
- Une suppression est bloquée si une vue sauvegardée référence l’asset. Sinon, la confirmation annonce le nombre de calques et la transaction supprime atomiquement asset, blob et références documentaires.
- La suppression d’un sprite complet actif rebascule sur le rig lorsqu’il contient au moins un slot; sélection et historique sont ensuite nettoyés.

## Migration et legacy

- Dexie v5 migre les documents, vues sauvegardées et la sauvegarde manuelle v4.
- L’ancien état global du personnage est transféré au groupe Berlu; les groupes personnalisés deviennent des groupes personnage.
- Les anciens assets `torso` marqués complet deviennent `character_full`; les autres deviennent `body`.
- Sprite complet et slots sont conservés ensemble, avec sélection du mode d’après la représentation visible.
- Les types, repositories, dépendances et composants sans consommateur liés aux anciens personnages, découpes et formats ont été retirés. `sharp` n’est plus installé.
- Les formats de sauvegarde antérieurs au schéma courant sont refusés; seuls les `@keyframes` CSS décoratifs subsistent.

## Gates validées

| Contrôle | Commande | Résultat |
| --- | --- | --- |
| TypeScript strict | `pnpm exec vue-tsc -p tsconfig.app.json --noEmit --incremental false` | Succès |
| ESLint sans réécriture | `pnpm exec eslint . --max-warnings=0` | Succès, 0 avertissement |
| Tests unitaires | `pnpm exec vitest run --reporter=dot` | 85 fichiers, 351 tests passés |
| Build applicatif | `pnpm run build` | Succès avec Vite 5.4.21 |
| Build Histoire | `pnpm run story:build` | 67 stories, 173 variantes |

Le build applicatif signale encore un chunk principal supérieur à 500 kB. Histoire 0.17 émet aussi ses avertissements historiques de bundle/CJS, sans faire échouer le build.
