# Vue technique du projet

## Objectif de cette page

Cette vue relie le produit à son implémentation sans remplacer la documentation du code. Pour comprendre l’intention et les comportements utilisateur, commencer par [PRODUCT.md](PRODUCT.md) et [FEATURES.md](FEATURES.md).

## Stack

| Domaine        | Technologie                                                     |
| -------------- | --------------------------------------------------------------- |
| Application    | Vue 3.5, Composition API, TypeScript strict                     |
| État client    | Pinia                                                           |
| Persistance    | Dexie 4 / IndexedDB                                             |
| UI headless    | Reka UI                                                         |
| Styles         | Tailwind CSS 4, tokens CSS, utilitaires CVA/clsx/tailwind-merge |
| Rendu de scène | Canvas 2D natif                                                 |
| Tests          | Vitest, Vue Test Utils, jsdom                                   |
| Catalogue UI   | Histoire                                                        |
| Build          | Vite 5                                                          |

L’application n’a actuellement aucun backend applicatif.

## Découpage

### `src/core`

Contrats métier indépendants de l’interface :

- catégories et métadonnées d’assets ;
- groupes, calques, transforms et caméra ;
- projet, résolution de plateau et snapshots ;
- règles par défaut de cardinalité, placement et profondeur.

### `src/features`

- `asset-manager` : bibliothèque, import, miniatures, validation, suppression et store d’assets ;
- `editor` : document courant, historique et compositions sauvegardées ;
- `project` : projet unique, réglages, export, sauvegarde complète et reset ;
- `studio` : shell de viewport, canvas, résolution de hiérarchie, matrices et hit-test.

### `src/infrastructure`

- schéma et migrations Dexie ;
- repositories pour projets, documents, snapshots et assets ;
- stockage et cache des blobs image.

### `src/ui`

Bibliothèque de composants génériques colocalisés. La plupart des composants possèdent types, story Histoire, tests, README et barrel d’export.

## Démarrage de l’application

Au montage de `App.vue` :

1. `useProjectStore` charge ou crée l’espace de travail unique ;
2. le seeder installe le pack de sprites si nécessaire ;
3. `useAssetStore` charge les assets ;
4. `useEditorStore` charge ou crée le document courant ;
5. `useWorkspaceBackupStore` compare l’espace de travail au snapshot manuel ;
6. une surveillance profonde marque la sauvegarde comme obsolète après modification.

Cette séquence explique pourquoi les premières données sont disponibles sans serveur et pourquoi un reset recrée automatiquement un studio fonctionnel.

## Modèle de données

### Projet

`Project` porte l’identifiant de l’unique document et les réglages du plateau : largeur, hauteur et couleur de fond.

### Asset

`Asset` sépare les métadonnées du fichier binaire :

- identité, nom, catégorie et tags ;
- dimensions naturelles ;
- référence `blobId` ;
- métadonnées éventuelles du personnage ;
- calibration éventuelle ;
- indicateur de déplacement libre.

`AssetBlobRecord` contient le `Blob`, son type MIME et sa taille. Cette séparation permet de manipuler les listes sans charger chaque image en mémoire.

### Document d’éditeur

`EditorDocument` est la source de vérité de la scène courante :

- une caméra ;
- des paramètres de profondeur de champ sélective ;
- des groupes ;
- des calques ;
- les dates et l’appartenance au projet.

Un calque référence un asset sans recopier son blob. Il possède sa catégorie, son groupe,
sa profondeur d’affichage, son ordre, ses états, son transform local et un rôle optique
facultatif `auto | background | subject`. Le mode `auto` conserve la compatibilité des
anciens documents : `background` rejoint le décor, toutes les autres catégories restent
dans le sujet net.

### Groupe

Deux types existent :

- `stage`, pour les catégories libres du plateau ;
- `character`, avec identité et mode actif `full` ou `rig`.

Le transform global d’un groupe personnage permet de manipuler un rig entier comme une seule unité.

### Snapshot de viewport

`ViewportSnapshot` copie caméra, groupes et calques et ajoute un nom et une miniature. Les assets restent référencés par identifiant, ce qui justifie le blocage de leur suppression lorsqu’un snapshot en dépend.

### Snapshot d’espace de travail

`WorkspaceSnapshot` copie projets, documents, compositions, assets et blobs, et embarque le catalogue des rigs sérialisé depuis `localStorage`. Le snapshot manuel utilise le schéma applicatif `5` et la base Dexie est en version `5` ; les anciens snapshots applicatifs `4` restent restaurables.

## Règles métier structurantes

### Cardinalité

- `singleton` : un calque par catégorie dans le groupe cible ; une nouvelle variante remplace l’ancienne.
- `multi` : plusieurs calques de la catégorie peuvent coexister.
- toutes les catégories de personnage se comportent comme des slots singleton par personnage.

### Placement

- `character-anchored` : l’asset est rattaché au groupe du personnage ;
- `free-transform` : l’asset est rattaché à un groupe de plateau et peut être manipulé indépendamment.

### Historique

Le store conserve des snapshots `before/after` des groupes et calques pour un maximum de 50 mutations. Les gestes continus sont ouverts puis validés comme une seule entrée. La persistance du document est sérialisée afin d’éviter qu’une écriture lente n’écrase un état plus récent.

### Rendu

`useHierarchyResolver` transforme le document et la bibliothèque en calques rendables. Il :

- ignore les éléments masqués ;
- choisit la représentation active de chaque personnage ;
- combine transforms de groupe, de calque et calibration ;
- normalise les échelles pour préserver les ratios ;
- applique les règles spécifiques d’arrière-plan et de mobilier legacy.

`useCanvasRenderer` dessine les calques triés sur Canvas 2D et produit également les captures propres utilisées par les miniatures et l’export PNG.

Le pipeline de profondeur de champ sépare les calques résolus en trois bandes : décor
floutable, sujet net, puis `foreground` toujours au premier plan. Les accessoires de
plateau peuvent changer entre les deux premières bandes sans changer de catégorie d’asset ;
l’ordre de hit-test suit le même ordre que le rendu. La bande `foreground` ignore tout rôle
optique accidentel et reste finale même lorsqu’un personnage dynamique possède un `zIndex`
de groupe supérieur. Le pipeline est court-circuité avant toute allocation de buffer
lorsque l’effet est désactivé, que son rayon est nul ou qu’aucun décor n’est visible. Les
buffers sont réutilisés tant que la résolution du plateau reste identique. La passe
gaussienne est indexée séparément par le décor et le rayon : déplacer le focus ou modifier
la transition ne reconstruit que le masque alpha, tandis que les changements de sujets
protégés ne touchent aucun de ces buffers. Le décor est rendu dans un buffer paddé dont les
pixels périphériques sont étendus avant le filtre, afin d’éviter les halos transparents aux
bords.

`DepthOfFieldOverlay` reste dans le DOM d’édition. Il regroupe une limite de netteté au
rôle `slider` et deux contrôles Reka UI. L’effet peut rester actif lorsque cet overlay est
masqué. Les événements continus sont ramenés à une mise à jour par frame avec
`requestAnimationFrame`, puis validés comme une seule mutation d’historique.

Les moteurs isolés couvrent notamment les matrices, le hit-test alpha, la sélection de cible et le comportement `cover` des arrière-plans.

## Persistance et portabilité

Les données de travail sont conservées dans IndexedDB. Le catalogue global des rigs utilise `localStorage`; les préférences légères, telles que les largeurs de sidebars et l’état de la visite, également.

Conséquences :

- pas de latence réseau ni de compte requis ;
- données isolées par origine, navigateur et profil ;
- quota et politiques de nettoyage contrôlés par le navigateur ;
- aucune récupération distante ;
- le PNG et le fichier de sauvegarde complète sont portables ; le JSON d’export de scène ne contient pas les images.

## Imports et URLs temporaires

Les fichiers sont validés dans le navigateur puis écrits dans une transaction asset/blob. Les `ObjectURL` servent à la prévisualisation, au décodage et au rendu ; les composants et services les révoquent après usage. Un cache de blobs limite les lectures répétées.

## Exports

- PNG : capture du rendu actif, avec caméra facultative et résolution native ou normalisée 1080p.
- JSON : plateau, document, métadonnées d’assets, date et version de format.
- Sauvegarde complète JSON v1 : snapshot applicatif v5, blobs encodés en base64 et catalogue de rigs v3.

Le format JSON d’export de scène, le fichier de sauvegarde complète v1 et le schéma de snapshot interne v5 répondent à des besoins différents et ne doivent pas être confondus.

## Qualité

La validation complète consignée dans `walkthrough.md` au terme de la dernière refonte comprend :

- TypeScript strict ;
- ESLint sans avertissement ;
- 90 fichiers de tests et 374 tests unitaires ;
- build Vite ;
- build Histoire avec 68 stories et 176 variantes.

Dette connue :

- chunk applicatif principal supérieur à 500 kB minifié ;
- avertissements historiques CJS d’Histoire 0.17 ;
- absence d’un scénario navigateur dédié à la migration d’une base IndexedDB v4 volumineuse.

Se reporter à [ROADMAP.md](../ROADMAP.md) pour le statut de validation le plus récent.

## Commandes de développement

```bash
pnpm run dev
pnpm run typecheck
pnpm run test:unit
pnpm run build
pnpm run story:dev
pnpm run story:build
```

`pnpm run lint` lance ESLint avec `--fix` et `pnpm run format` réécrit les fichiers avec Prettier.

## Points d’attention pour les évolutions

- Toute catégorie ajoutée doit définir cardinalité, placement, profondeur, couleur et comportement de rendu.
- Une évolution du modèle persistant nécessite une migration Dexie transactionnelle et des fixtures legacy.
- Les deux configurations d’un personnage doivent rester conservées lors d’un basculement de mode.
- La suppression d’un asset doit vérifier les documents et compositions qui le référencent.
- Le rendu interactif, les miniatures, les snapshots et l’export doivent rester cohérents entre eux.
- Une fonctionnalité d’export de workspace devra embarquer les blobs ou définir explicitement une stratégie de fichiers associés.
