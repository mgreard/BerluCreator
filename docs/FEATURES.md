# Catalogue fonctionnel

> Ce document décrit les comportements exposés par l’application au 28 août 2026. Les capacités internes non accessibles dans l’interface sont signalées séparément.

## Légende

- **Disponible** : utilisable dans l’interface actuelle.
- **Partiel** : présent, mais avec une limite importante ou sans interface complète.
- **Interne** : supporté par le domaine ou le store, mais non présenté comme fonctionnalité utilisateur.
- **Hors périmètre** : volontairement absent du produit actuel.

## Vue d’ensemble

| Domaine                            | Statut         | Résumé                                                                                    |
| ---------------------------------- | -------------- | ----------------------------------------------------------------------------------------- |
| Bibliothèque d’assets              | Disponible     | Navigation par personnage et décor, recherche, miniatures et comptages                    |
| Import d’images                    | Disponible     | Import multiple PNG/JPEG/WebP/SVG, un asset par fichier                                   |
| Composition sur canvas             | Disponible     | Ajout, remplacement, sélection, déplacement, redimensionnement et suppression             |
| Flou de profondeur MVP             | Disponible     | Focus draggable et flou sélectif de l’arrière-plan, désactivable                          |
| Personnage complet et rig          | Disponible     | Deux représentations conservées, une seule visible à la fois                              |
| Historique                         | Disponible     | Undo/redo de 50 mutations, gestes regroupés                                               |
| Cadrage caméra                     | Disponible     | Cadre éditable, facultatif à l’export                                                     |
| Compositions sauvegardées          | Disponible     | Capture avec miniature, chargement et suppression                                         |
| Sauvegarde complète                | Disponible     | Snapshot local et fichier portable avec images et rigs, export, import et restauration    |
| Export                             | Disponible     | PNG natif/1080p et JSON de structure                                                      |
| Organisation avancée des calques   | Interne        | Le domaine supporte groupes, ordre, verrouillage et visibilité, sans panneau dédié actuel |
| Multi-projet, cloud, collaboration | Hors périmètre | Aucun backend ni compte utilisateur                                                       |
| Animation et vidéo                 | Hors périmètre | Timeline et keyframes supprimées                                                          |

## 1. Initialisation et prise en main

### Premier lancement — Disponible

- Création automatique d’un projet et d’un document uniques.
- Installation initiale puis synchronisation additive du pack de sprites livré avec l’application, sans suppression des imports personnels.
- Démarrage d’une visite guidée en quatre étapes : sprites, scène, sauvegarde, export.
- Possibilité de relancer la visite depuis l’en-tête.

Les données sont conservées dans le profil du navigateur. Une nouvelle machine, un autre navigateur, une navigation privée ou un nettoyage des données crée un espace distinct.

### Interface de studio — Disponible

- En-tête global avec état de sauvegarde, accès aux compositions, aide, paramètres, données de l’application et export.
- Bibliothèque gauche repliable et redimensionnable ; largeur mémorisée localement.
- Canvas central occupant tout l’espace restant.
- Panneau droit de compositions repliable et redimensionnable ; largeur mémorisée localement.
- Interface sombre plein écran, conçue en priorité pour un usage desktop.

## 2. Bibliothèque d’assets

### Navigation — Disponible

La bibliothèque propose :

- une vue « Tous les sprites » ;
- un panneau par personnage détecté dans les métadonnées ;
- les sous-catégories sprite complet, corps, têtes, yeux, bouches, bras gauche, bras droit, tenues et accessoires ;
- les catégories de décor arrière-plans, bureaux, objets du bureau, accessoires plateau et premier plan ;
- un compteur par personnage et catégorie ;
- une couleur de repère propre à chaque catégorie.

Les personnages sont construits dynamiquement à partir des métadonnées des assets importés, et non à partir d’une liste figée.

### Recherche — Disponible

- Filtrage insensible à la casse.
- Recherche sur le nom de l’asset et sur ses tags.
- Le filtre s’applique à la sélection de personnage ou de catégorie active.

### Miniatures — Disponible

- Génération paresseuse d’une vignette carrée centrée sur le contenu alpha significatif.
- Conservation de plusieurs zones visuelles séparées.
- Ignorance des pixels parasites isolés.
- Cache des miniatures dérivées par blob.
- Repli sur l’image originale si le canvas de miniature n’est pas disponible.

Ce traitement n’altère jamais le fichier source ni les dimensions utilisées pour le rendu final.

## 3. Import et suppression d’assets

### Import — Disponible

Formats acceptés : PNG, JPEG, WebP et SVG décodables par le navigateur.

Le flux d’import permet de choisir :

- le domaine « Personnages » ou « Plateau & Décor » ;
- pour un personnage, le mode « personnage complet » ou « squelette » ;
- un personnage existant dans lequel classer le sprite, ou la création d’un nouveau personnage ;
- le slot de rig ou la catégorie de décor ;
- un ou plusieurs fichiers.

À l’ouverture, le personnage et la catégorie sélectionnés dans la bibliothèque sont repris automatiquement. Sans contexte de bibliothèque, la modale reprend le personnage sélectionné sur le plateau puis utilise « Personnage complet » comme catégorie de repli.

Règles fonctionnelles :

- un fichier produit exactement un asset ;
- le nom d’un nouveau personnage ne peut pas réutiliser l’identifiant normalisé d’un personnage existant ;
- les pixels et dimensions d’origine sont conservés ;
- le nom de fichier sans extension sert de nom par défaut ;
- type MIME, décodage, dimensions et métadonnées sont validés avant écriture ;
- chaque fichier est traité indépendamment ;
- un succès sort de la file immédiatement ;
- un échec reste visible et peut être retenté ;
- les prévisualisations temporaires sont libérées à la fermeture ou au retrait.

### Suppression — Disponible avec protection

- Une confirmation précise le nombre de calques affectés.
- Sans composition sauvegardée dépendante, l’asset, son blob et ses références du document sont supprimés atomiquement.
- Si une composition sauvegardée référence l’asset, la suppression est bloquée et les compositions concernées sont nommées.

Cette règle privilégie l’intégrité des compositions au nettoyage rapide de la bibliothèque.

## 4. Composition de la scène

### Ajout, remplacement et retrait — Disponible

Depuis la bibliothèque :

- premier clic : ajout à la scène ;
- clic sur une autre variante singleton : remplacement dans le même emplacement ;
- clic sur l’asset déjà visible : retrait de la scène.

Les catégories singleton comprennent notamment l’arrière-plan, le bureau et tous les slots d’un personnage. Les accessoires de plateau, objets de bureau et premiers plans acceptent plusieurs calques.

### Placement — Disponible

- Les assets libres sont ajoutés dans le groupe de plateau correspondant.
- Hors arrière-plan, un nouvel asset libre est centré sur le plateau.
- Les personnages sont rattachés au groupe correspondant à leur identité.
- Le rendu de l’arrière-plan utilise une logique de couverture du plateau.
- Les éléments sont sélectionnés par hit-test alpha : les zones entièrement transparentes ne capturent pas le clic.

### Manipulation directe — Disponible

- Clic pour sélectionner.
- Glisser-déposer pour déplacer les éléments autorisés.
- Poignées de redimensionnement autour de la sélection.
- Redimensionnement uniforme uniquement, afin de conserver le ratio naturel.
- HUD contextuel avec nom, dimensions, suppression et désélection.
- Pour chaque accessoire de plateau, choix individuel `Derrière` ou `Devant` le bureau ;
  cette action ajuste son z-index, suit undo/redo et ne modifie pas son flou.
- Double-clic sur le personnage actif pour désélectionner sans supprimer.
- Clic dans l’espace vide pour vider la sélection.

Les bureaux et les objets de décor configurés comme mobiles suivent les mêmes règles que les autres sprites libres.

### Personnage complet et rig — Disponible

Un personnage peut mémoriser simultanément :

- un sprite complet ;
- un rig composé de corps, tête, yeux, bouche, bras gauche, bras droit et accessoire.

Une seule représentation est rendue à la fois. Sélectionner un asset complet active le mode complet ; sélectionner un slot de rig active le rig. Basculer de mode ne détruit pas la configuration inactive.

Toutes les pièces visibles du rig sont manipulées comme un personnage indivisible. La position et l’échelle appartiennent au groupe ; les ajustements internes servent seulement à l’assemblage.

### Historique — Disponible

- Maximum de 50 mutations atomiques.
- Undo : `Ctrl/Cmd+Z`.
- Redo : `Ctrl/Cmd+Shift+Z` ou `Ctrl+Y`.
- Un déplacement ou redimensionnement continu produit une seule entrée d’historique.
- Ajout, retrait, remplacement, mode du personnage et transformations sont annulables.
- La caméra est persistée, mais volontairement exclue de l’historique.
- Charger une composition vide les piles undo/redo.

### Flou de profondeur — MVP disponible

- L’effet est désactivé par défaut afin de conserver le chemin de rendu direct pendant
  la construction de la scène.
- Une commande du viewport permet de l’activer ou de le désactiver à tout moment.
- La catégorie `background` rejoint automatiquement le décor floutable. Les personnages,
  bureaux, objets du bureau et premiers plans restent automatiquement dans le sujet net.
- Les assets `foreground` forment une bande finale toujours dessinée et sélectionnée
  devant les personnages, y compris ceux ajoutés dynamiquement.
- Un accessoire de plateau sélectionné peut être placé dans `Décor` ou `Sujet` depuis le
  HUD. Ce choix appartient à l’instance du calque et non à l’asset réutilisable ; il ne
  modifie pas sa position devant ou derrière le bureau.
- L’état est conservé dans le document, l’historique et les compositions sauvegardées.
- Le viewport, les miniatures et l’export PNG utilisent le même pipeline.
- L’activation de l’effet et l’affichage de ses réglages sont deux commandes distinctes :
  le rendu peut rester actif dans un viewport sans aides d’édition.
- Lorsque les réglages sont visibles et la caméra inactive, une limite horizontale de
  netteté se déplace à la souris, au tactile ou au clavier.
- `Intensité` règle le rayon entre 0 et 32 px ; `Douceur` règle le fondu entre 0 et 600 px.
- Chaque geste continu produit une seule entrée d’historique et au plus une mise à jour
  réactive par frame.
- La passe floutée est réutilisée lorsque seuls les personnages, le mobilier ou les aides
  d’édition changent.

L’overlay est une aide DOM et n’apparaît jamais dans les miniatures ou les exports. La
validation visuelle automatisée reste à exécuter dès qu’un navigateur contrôlable est
disponible dans l’environnement de développement.

### Organisation avancée — Interne

Le modèle métier sait créer et supprimer des groupes, changer la profondeur, masquer, verrouiller, replier et ordonner des calques. Les anciens composants de hiérarchie et de réglage ont cependant été retirés du shell simplifié. Ces opérations ne doivent donc pas être considérées comme un parcours utilisateur livré tant qu’une interface dédiée n’est pas réintroduite.

## 5. Plateau et caméra

### Dimensions du plateau — Disponible

Formats proposés :

- 1920 × 1080, 16:9 Full HD ;
- 1280 × 720, 16:9 HD ;
- 1080 × 1080, carré ;
- 1080 × 1920, vertical/short ;
- largeur et hauteur personnalisées.

La résolution initiale du domaine est 1792 × 1024. Modifier le plateau change la résolution logique de rendu, pas seulement la taille d’affichage à l’écran.

### Cadrage caméra — Disponible

- Activation ou désactivation depuis le canvas.
- Cadre positionnable et redimensionnable dans le plateau.
- Ratios 16:9, 9:16, 1:1 ou personnalisé dans le modèle.
- Sauvegarde dans le document courant et dans les compositions.
- Application facultative lors de l’export PNG.

Le cadrage sert à extraire une zone de la scène ; il ne crée pas une animation de caméra.

## 6. Compositions sauvegardées

### Création — Disponible

- Nom libre avec valeur par défaut basée sur l’heure.
- Miniature générée depuis le rendu propre de la scène.
- Copie de la caméra, des groupes et des calques.
- Affichage du nombre d’éléments visibles lors de la capture.

### Consultation — Disponible

- Liste compacte avec miniature, nom, date et nombre de calques.
- Chargement ou suppression depuis chaque ligne.
- Panneau automatiquement replié après chargement.

### Chargement — Disponible, destructif pour le document courant

Charger une composition remplace atomiquement la caméra, les groupes et les calques du document courant. La sélection et l’historique sont réinitialisés. Ce n’est pas une fusion entre deux scènes.

## 7. Sauvegarde complète de l’application

### Création et état — Disponible, locale

Le menu des données permet de créer une sauvegarde contenant :

- le projet ;
- le document courant ;
- les compositions sauvegardées ;
- les métadonnées d’assets ;
- tous les blobs image ;
- le catalogue global des rigs, y compris les placements, compatibilités et choix par défaut.

Un badge indique : vérification, aucune sauvegarde, sauvegardé, modifications à sauvegarder, sauvegarde en cours ou erreur.

### Restauration — Disponible

Après confirmation, la restauration remplace les projets, documents, compositions, assets et blobs courants par le snapshot manuel. Le studio recharge ensuite ces données.

### Fichier portable — Disponible

Le menu permet aussi d’exporter un fichier JSON autonome puis de le réimporter. Les blobs image y sont encodés en base64 et le catalogue des rigs est inclus. L’import valide le format et les tailles binaires avant de remplacer transactionnellement les données courantes. Les préférences d’interface (thème, largeur des panneaux et état de la visite) ne font pas partie de cette sauvegarde métier.

### Réinitialisation usine — Disponible

- Confirmation renforcée par la saisie de `RESET`.
- Suppression de la base locale et des préférences connues.
- Rechargement de l’application, recréation du projet et réinstallation du pack de démonstration.

## 8. Export

### PNG — Disponible

- Rendu propre sans repères d’édition.
- Résolution native du plateau ou du cadrage.
- Option 1080p respectant le ratio actif.
- Application facultative de la caméra.
- Téléchargement direct d’un fichier PNG.

### JSON — Disponible

Le fichier contient :

- paramètres du plateau ;
- document courant avec caméra, groupes, calques et transforms ;
- métadonnées de tous les assets ;
- date d’export ;
- version de format `3.2.0`.

Les blobs image ne sont pas inclus. Le JSON décrit la scène mais ne constitue pas à lui seul une sauvegarde portable et autonome.

### Animation et vidéo — Hors périmètre

Il n’existe aucun export GIF, vidéo ou séquence d’images. Le modèle de timeline et les keyframes ont été supprimés du produit.

## 9. Qualité et accessibilité fonctionnelle

- Contrôles nommés avec labels, titres ou attributs ARIA dans les parcours principaux.
- Navigation clavier prise en charge par les primitives UI et raccourcis d’historique.
- Réduction des animations respectée par plusieurs composants.
- Toasts de succès et d’erreur pour les actions importantes.
- Dialogues de confirmation pour les opérations destructives.

La conformité à un référentiel d’accessibilité complet n’est pas établie par le dépôt et ne doit pas être revendiquée sans audit dédié.
