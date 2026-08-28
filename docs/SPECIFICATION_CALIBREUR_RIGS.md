# Spécification technique — Calibreur de rigs et gestion des rigs

## 1. Objet du document

Ce document décrit l’état actuel et l’architecture cible du système de rigs de BerluCreator. Il est conçu pour permettre à un développeur ou à un LLM de reprendre l’implémentation sans dépendre de l’historique de conversation.

La cible ajoute au catalogue de rigs v2 existant :

- un corps racine unique par rig ;
- des catégories de pièces activables ou désactivables par rig ;
- un placement par défaut hérité au niveau de chaque catégorie ;
- des surcharges de placement propres à certains sprites ;
- des compatibilités par élément ;
- la duplication d’une configuration entre deux rigs d’un même personnage ;
- une interface de calibration latérale qui ne recouvre jamais le canvas ;
- une migration sans perte du catalogue v2 vers le futur catalogue v3.

## 2. État de l’implémentation au 29 août 2026

Le catalogue v3 est entièrement implémenté et validé. Il prend en charge :

- un corps racine unique et sa calibration par rig ;
- des catégories de pièces configurables activables/désactivables par rig (état dormant préservé) ;
- un template hérité au niveau de chaque catégorie (défini par l'élément par défaut) ;
- des surcharges de placement (`calibrationOverride`) propres aux pièces secondaires ;
- des boutons de duplication atomique par champ (`X`, `Y`, `Échelle`, `Rotation`, `Z-index`) pour propager une valeur à toute la catégorie ;
- la duplication complète de configuration entre deux rigs d’un même personnage via modale dédiée avec confirmation ;
- l'activation directe de rig par sélection de corps dans la bibliothèque d'assets (sidebar gauche) ;
- le filtrage dynamique des catégories et sprites dans la sidebar selon la disponibilité du rig actif ;
- l’import/export JSON global v3 et la persistance dans `localStorage` sous la clé `berlu-creator:rig-catalog:v3` ;
- la migration automatique et sans perte des configurations v2 vers v3.

Le dernier état validé compte 97 fichiers Vitest et 426 tests au vert (100%), avec TypeScript (`vue-tsc`), ESLint, le build de production Vite et le build Histoire au vert.

### 2.1 Fichiers principaux existants

| Responsabilité                        | Fichier                                                              |
| ------------------------------------- | -------------------------------------------------------------------- |
| Types du catalogue                    | `src/features/studio/rig-calibration/rig-catalog.types.ts`           |
| Création, identité et parsing         | `src/features/studio/rig-calibration/rig-catalog.service.ts`         |
| Persistance et mutations Pinia        | `src/features/studio/rig-calibration/rig-catalog.store.ts`           |
| Application d’un rig au document      | `src/features/studio/rig-calibration/useRigRuntime.ts`               |
| Suggestion automatique                | `src/features/studio/rig-calibration/rig-auto-calibration.ts`        |
| Orchestration du calibreur            | `src/features/studio/components/RigCalibrationWorkspace.vue`         |
| UI générique du panneau               | `src/ui/components/ui/rig-calibration-panel/RigCalibrationPanel.vue` |
| Manipulation directe du canvas        | `src/features/studio/components/StageCanvas.vue`                     |
| Résolution des transformations        | `src/features/studio/composables/useHierarchyResolver.ts`            |
| Sélection depuis la bibliothèque      | `src/features/asset-manager/components/AssetLibraryPanel.vue`        |
| Création atomique des calques         | `src/features/editor/stores/useEditorStore.ts`                       |
| Intégration du panneau dans le layout | `src/App.vue`                                                        |

## 3. Terminologie

- **Personnage** : ensemble d’assets partageant le même `character.key`.
- **Rig** : configuration d’assemblage d’un personnage autour d’un corps racine unique.
- **Corps** : asset de catégorie `body`. Il peut être un buste, un corps avec bras intégrés ou un corps entier avec jambes.
- **Catégorie configurable** : catégorie de pièce autre que `body`, par exemple `head`, `eyes`, `mouth`, `arms_left`, `arms_right` ou `props_host`.
- **Slot** : emplacement logique correspondant à une catégorie. Un seul élément actif par slot est affiché dans un rig.
- **Template de catégorie** : transformation par défaut héritée par les éléments compatibles d’une catégorie dans un rig donné.
- **Surcharge locale** : transformation propre à un élément qui remplace le template de sa catégorie.
- **Élément par défaut** : élément automatiquement chargé pour un slot lors de l’activation complète du rig.
- **Catégorie désactivée** : catégorie entièrement incompatible avec le rig. Aucun de ses éléments ne peut être chargé dans ce rig.
- **Configuration dormante** : compatibilités et calibrations conservées en stockage, mais ignorées tant que la catégorie est désactivée.

## 4. Catégories prises en charge

Le corps reste une catégorie technique du moteur, mais ne doit pas apparaître dans la collection compatible du calibreur.

```ts
export const RIG_SLOT_CATEGORIES = [
  'body',
  'head',
  'eyes',
  'mouth',
  'arms_left',
  'arms_right',
  'props_host'
] as const

export const RIG_CONFIGURABLE_CATEGORIES = [
  'head',
  'eyes',
  'mouth',
  'arms_left',
  'arms_right',
  'props_host'
] as const
```

`body` est sélectionné exclusivement dans la section « Corps et rig ».

## 5. Invariants métier

Les règles suivantes doivent toujours être vraies :

1. Un rig appartient à un seul personnage.
2. Un rig possède exactement un corps racine.
3. Deux corps différents produisent deux rigs différents.
4. La catégorie `body` ne possède ni compatibilité individuelle ni template de catégorie.
5. Une catégorie désactivée ne produit aucun calque, même si elle contient des éléments dormants.
6. Une catégorie active contient au maximum un élément par défaut.
7. Un élément compatible utilise soit le template de sa catégorie, soit une surcharge locale, jamais les deux comme sources concurrentes.
8. Une calibration de rig ne doit pas dépendre de l’identifiant local d’un asset pour être exportable.
9. Un même asset peut utiliser des calibrations effectives différentes dans plusieurs rigs.
10. Le catalogue de rigs est la source d’autorité. `Asset.calibration` n’est qu’une donnée historique de migration ou de repli initial.
11. Le premier plan de la scène reste prioritaire sur tous les calques de personnage, indépendamment du z-index interne au rig.

## 6. Modèle de données cible

Le catalogue cible doit passer à la version 3. Le nom du schéma peut rester `berlu-creator/rig-catalog`, mais la constante de version et la clé de stockage doivent évoluer.

```ts
export const RIG_CATALOG_VERSION = 3 as const

export type RigConfigurableCategory = Exclude<RigSlotCategory, 'body'>

export interface RigAssetIdentity {
  name: string
  category: RigSlotCategory
  width: number
  height: number
}

export interface RigCategoryDefinition {
  category: RigConfigurableCategory
  enabled: boolean
  template?: AssetCalibration
  defaultPartKey?: string
}

export interface RigPartDefinition {
  asset: RigAssetIdentity
  calibrationOverride?: AssetCalibration
}

export interface RigDefinition {
  id: string
  name: string
  characterKey: string
  characterName: string
  canvasWidth: number
  canvasHeight: number

  body: RigAssetIdentity
  bodyCalibration: AssetCalibration

  categories: RigCategoryDefinition[]
  parts: RigPartDefinition[]
  excludedPartKeys: string[]
  updatedAt: number
}

export interface RigCatalogFile {
  schema: 'berlu-creator/rig-catalog'
  version: 3
  exportedAt: string
  defaultRigByCharacter: Record<string, string>
  rigs: RigDefinition[]
}
```

### 6.1 Pourquoi séparer le corps des pièces

Le catalogue v2 stocke aussi le corps dans `parts`. La v3 doit éviter cette duplication :

- `rig.body` identifie le corps racine ;
- `rig.bodyCalibration` place le corps dans le canevas canonique ;
- `rig.parts` ne contient que les catégories configurables ;
- le corps n’apparaît plus dans la section des compatibilités.

### 6.2 Pourquoi le template appartient au rig et à la catégorie

Une tête peut être correctement placée à `(100, 40)` sur un buste et à `(120, 10)` sur un corps complet. Le template doit donc appartenir au couple rig + catégorie, et non à l’asset global.

### 6.3 Source d’autorité

Ne plus écrire la calibration courante dans `Asset.calibration` après chaque modification. Cette pratique produit un conflit « dernier enregistrement gagnant » lorsqu’un asset est partagé entre plusieurs rigs.

`Asset.calibration` peut être utilisé uniquement :

- pour initialiser une calibration lors de la création ou migration d’un rig ;
- comme repli pour un ancien document dépourvu de catalogue ;
- sans être modifié lors des calibrations v3 normales.

## 7. Résolution d’une calibration effective

Le moteur doit utiliser une fonction pure unique pour obtenir la transformation d’une pièce.

```ts
function effectiveCalibration(
  rig: RigDefinition,
  part: RigPartDefinition,
  asset?: Asset
): AssetCalibration | null {
  const category = rig.categories.find((candidate) => candidate.category === part.asset.category)

  if (!category?.enabled) return null

  return part.calibrationOverride ?? category.template ?? identityCalibration(asset)
}
```

Un résultat `null` signifie que la pièce ne doit pas être chargée.

### 7.1 Résolution du corps

Le corps utilise toujours `rig.bodyCalibration`. Sa présence ne dépend d’aucun toggle de catégorie.

## 8. Héritage par catégorie

### 8.1 Création du premier template

Lorsqu’une catégorie active ne possède encore aucun template :

1. l’utilisateur sélectionne un premier sprite compatible ;
2. il le positionne sur le corps ;
3. il clique sur « Enregistrer » ou ferme/change de sélection ;
4. la transformation devient le template de la catégorie ;
5. le sprite devient l’élément par défaut si aucun défaut n’existe ;
6. tous les autres sprites compatibles sans surcharge héritent immédiatement de ce template.

### 8.2 Modification du template

Pour conserver une UI simple, l’élément par défaut du slot sert d’éditeur du template :

- enregistrer l’élément par défaut modifie le template de la catégorie ;
- tous les éléments sans surcharge suivent la nouvelle valeur ;
- les éléments personnalisés conservent leur surcharge.

### 8.3 Création d’une surcharge

Enregistrer un élément compatible qui n’est pas l’élément par défaut crée ou remplace uniquement `calibrationOverride` pour cette pièce.

### 8.4 Réinitialisation

Pour un élément personnalisé, « Réinitialiser » :

1. supprime `calibrationOverride` ;
2. applique immédiatement le template de la catégorie dans le viewport ;
3. affiche l’état « Valeurs héritées de la catégorie ».

Pour l’élément par défaut, le bouton peut être désactivé ou remettre le brouillon à la dernière valeur sauvegardée. Il ne doit pas supprimer silencieusement le template utilisé par toute la catégorie.

### 8.5 États visuels

Le panneau doit afficher exactement un de ces états :

- `Template de la catégorie` pour l’élément par défaut ;
- `Valeurs héritées de la catégorie` pour une pièce sans surcharge ;
- `Valeurs personnalisées` pour une pièce avec surcharge ;
- `Template non défini` pour la première pièce d’une catégorie vierge.

## 9. Activation ou désactivation complète d’une catégorie

Chaque catégorie configurable possède un interrupteur « Utiliser cette catégorie dans ce rig ».

### 9.1 Désactivation

Quand l’utilisateur désactive une catégorie :

1. `category.enabled` passe à `false` ;
2. le calque actif de cette catégorie est retiré du viewport ;
3. le runtime ignore le template, l’élément par défaut et les pièces de la catégorie ;
4. la sélection du sprite et les champs de placement deviennent inactifs ;
5. l’initialisation additive des assets ne doit pas réactiver ou repeupler visuellement la catégorie ;
6. les configurations existantes restent stockées comme données dormantes.

La conservation dormante permet de réactiver une catégorie sans perdre son travail de calibration.

### 9.2 Réactivation

Quand l’utilisateur réactive une catégorie :

1. les anciennes compatibilités et calibrations redeviennent disponibles ;
2. si un élément par défaut valide existe, il est chargé dans le viewport ;
3. sinon, la catégorie reste vide jusqu’à la sélection d’un élément compatible.

### 9.3 Cas d’usage obligatoire

Un corps contenant déjà ses bras doit pouvoir désactiver `arms_left` et `arms_right`. Cette désactivation ne doit modifier ni les assets ni les autres rigs du personnage.

## 10. Compatibilité individuelle des éléments

La compatibilité individuelle ne s’applique qu’aux catégories actives et non-corps.

### 10.1 Ajouter une compatibilité

- Ajouter la pièce à `rig.parts` si elle n’existe pas.
- Retirer sa clé de `excludedPartKeys`.
- Ne pas créer de surcharge : la pièce doit hériter du template.
- La définir comme élément par défaut uniquement si la catégorie n’en possède aucun.

### 10.2 Retirer une compatibilité

- Retirer la pièce de la liste active des compatibilités ou la marquer explicitement exclue.
- Ajouter sa clé stable à `excludedPartKeys` afin que `initialize()` ne la réintroduise pas.
- Si elle était l’élément par défaut, choisir le premier élément compatible restant ou vider `defaultPartKey`.
- Si elle est affichée, charger le nouveau défaut ou retirer le calque du viewport.

### 10.3 Identité stable d’un asset

Conserver le principe v2 :

```text
category + nom normalisé + largeur + hauteur
```

Ne pas utiliser uniquement `asset.id`, car les identifiants IndexedDB peuvent différer entre deux installations.

## 11. Sélection depuis la bibliothèque d’assets

La fonction de sélection doit suivre cet ordre déterministe.

### 11.1 Asset de catégorie `body`

- Activer le rig dont le corps correspond à l’asset.
- Charger le corps et tous les éléments par défaut des catégories actives.

### 11.2 Pièce compatible avec le rig actif

- Remplacer uniquement le calque du même slot.
- Utiliser sa calibration effective.
- Ne pas reconstruire les autres slots.

### 11.3 Pièce incompatible avec le rig actif, mais compatible ailleurs

- Rechercher les rigs du même personnage où la catégorie est active et la pièce compatible.
- Priorité : rig de base du personnage s’il est compatible, puis premier rig selon l’ordre stable du catalogue.
- Activer le rig complet cible.
- Remplacer ensuite son slot par la pièce sélectionnée si elle n’est pas déjà le défaut.

### 11.4 Catégorie désactivée dans le rig actif

La catégorie est considérée incompatible. Appliquer la règle 11.3 sans demander de confirmation.

### 11.5 Pièce incompatible avec tous les rigs

- Ne modifier ni le viewport ni le rig actif.
- Afficher un toast expliquant que la pièce doit d’abord être associée depuis le calibreur.

## 12. Activation complète d’un rig

`activateRig()` doit construire atomiquement :

1. le corps racine avec `bodyCalibration` ;
2. pour chaque catégorie active, l’élément par défaut résolvable ;
3. aucun calque pour une catégorie désactivée ou sans défaut valide.

Le groupe personnage reçoit :

```ts
group.activeMode = 'rig'
group.activeRigId = rig.id
```

L’application doit préserver le calque `character_full` en mémoire si le comportement actuel l’exige, mais celui-ci reste masqué en mode rig.

## 13. Duplication inter-rigs

### 13.1 Interface

Dans la section « Corps et rig », ajouter :

> Copier la configuration depuis un autre rig

Le bouton ouvre une modale listant uniquement les autres rigs du même personnage.

Après sélection, afficher une confirmation explicite :

> Cette action remplacera les compatibilités et placements actuels de ce rig.

### 13.2 Données copiées

Copier du rig source vers le rig cible :

- l’état actif/inactif de chaque catégorie ;
- les templates de catégorie ;
- les éléments compatibles ;
- les surcharges locales ;
- les éléments par défaut ;
- les exclusions explicites.

### 13.3 Données conservées sur le rig cible

Ne pas remplacer :

- `id` ;
- `name` ;
- `characterKey` et `characterName` ;
- `body` ;
- `bodyCalibration` ;
- le repère canonique du rig cible, sauf décision produit ultérieure explicite.

Le corps cible est différent : sa calibration ne doit pas être écrasée par celle du corps source.

### 13.4 Après duplication

- Mettre à jour `updatedAt`.
- Persister immédiatement le catalogue.
- Réactiver le rig cible dans le viewport.
- Sélectionner le corps ou la première catégorie active.
- Afficher un toast de succès.

## 14. Interface du calibreur

Le calibreur reste dans une colonne redimensionnable placée à droite du viewport. Il ne doit jamais utiliser `position: absolute` au-dessus du canvas.

### 14.1 Section 1 — Corps et rig

- Sélecteur « Corps principal ».
- Dimensions natives du corps.
- Badge du rig de base.
- Bouton « Utiliser comme base de l’app ».
- Bouton « Copier la configuration depuis un autre rig ».

Changer de corps sauvegarde d’abord le brouillon courant, puis active le rig sélectionné.

### 14.2 Section 2 — Collection compatible

- Sélecteur « Type d’élément » sans l’option `body`.
- Interrupteur « Utiliser cette catégorie dans ce rig ».
- Sélecteur « Sprite ».
- Interrupteur « Compatible avec ce corps ».
- Action « Définir comme élément par défaut ».

Quand la catégorie est désactivée :

- le sélecteur de sprite est désactivé ;
- les actions de compatibilité et de défaut sont désactivées ;
- afficher une explication courte, par exemple « Cette partie est déjà intégrée au corps ».

### 14.3 Section 3 — Placement sur le corps

- Badge d’héritage ou de surcharge.
- Champs `X`, `Y`, `Échelle`, `Rotation`, `Z-index`.
- Bouton `Auto`.
- Bouton `Réinitialiser`.
- Bouton `Enregistrer`.

Les champs sont désactivés si :

- la catégorie est désactivée ;
- aucun sprite n’est sélectionné ;
- le sprite n’est pas compatible.

### 14.4 Manipulation directe

En mode calibration :

- cliquer une pièce du rig la sélectionne individuellement ;
- glisser modifie `X` et `Y` du brouillon ;
- les flèches déplacent de 1 px ;
- `Maj` + flèches déplacent de 10 px ;
- la profondeur, l’échelle et la rotation restent accessibles dans les champs ;
- les changements de sélection et la fermeture sauvegardent le brouillon courant.

### 14.5 Brouillon et sauvegarde

Le store global ne doit pas être muté à chaque frappe avant de connaître la sémantique template/surcharge.

Le workspace doit maintenir un brouillon local :

```ts
interface RigCalibrationDraft {
  rigId: string
  assetKey: string
  value: AssetCalibration
  dirty: boolean
}
```

La sauvegarde est déclenchée par :

- le bouton « Enregistrer » ;
- un changement de sprite ;
- un changement de catégorie ;
- un changement de rig ;
- la fermeture ou le démontage du panneau.

## 15. Auto-calibration

Conserver l’analyse actuelle des bornes alpha comme suggestion initiale.

Règles :

- `Auto` modifie uniquement le brouillon et le calque de prévisualisation ;
- la suggestion n’est persistée qu’à la sauvegarde ;
- si aucun template n’existe, enregistrer la suggestion du premier élément crée le template ;
- l’auto-calibration n’est pas considérée comme une reconnaissance anatomique fiable ;
- l’utilisateur reste responsable de la validation visuelle.

## 16. Persistance et export

### 16.1 Stockage local

Utiliser une nouvelle clé :

```text
berlu-creator:rig-catalog:v3
```

Le factory reset doit supprimer les clés v1, v2 et v3.

### 16.2 Export du catalogue

L’export manuel doit contenir le catalogue v3 complet, y compris :

- catégories désactivées ;
- données dormantes ;
- templates ;
- surcharges ;
- exclusions ;
- rigs de base.

### 16.3 Export de scène

Le JSON de scène doit continuer d’inclure le catalogue global. Incrémenter sa version applicative si le contrat d’export change.

## 17. Migration du catalogue v2 vers v3

Le parser doit accepter les versions 2 et 3 pendant la période de migration.

Pour chaque rig v2 :

1. Trouver la pièce `body` correspondant à `rig.body`.
2. Copier sa calibration vers `bodyCalibration`.
3. Retirer toutes les pièces `body` de `parts`.
4. Pour chaque catégorie configurable :
   - créer une configuration `enabled: true` ;
   - trouver la pièce marquée `isDefault` ;
   - utiliser sa calibration comme `template` ;
   - utiliser sa clé comme `defaultPartKey` ;
   - ne pas lui créer de surcharge ;
   - transformer la calibration des autres pièces en surcharge seulement si elle diffère du template.
5. Conserver `excludedPartKeys`.
6. Persister le résultat sous la clé v3 après migration réussie.
7. Ne supprimer la clé v2 qu’après validation et écriture de la v3.

Une comparaison de calibration doit tolérer de petites différences flottantes pour les échelles et rotations.

## 18. API de store attendue

Le store v3 devrait exposer au minimum :

```ts
rigById(id)
rigsForCharacter(characterKey)
defaultRig(characterKey)
compatibleRigs(asset)
partForAsset(rig, asset)
categoryForRig(rig, category)
effectiveCalibration(rig, asset)

setCategoryEnabled(rigId, category, enabled)
setPartCompatibility(rigId, asset, compatible)
setDefaultPart(rigId, asset)
savePartCalibration(rigId, asset, calibration)
resetPartCalibration(rigId, asset)
updateBodyCalibration(rigId, calibration)
duplicateRigConfiguration(sourceRigId, targetRigId)
setDefaultRig(characterKey, rigId)

initialize(assets)
exportCatalog()
importCatalog(raw, assets)
persist()
```

Toutes les mutations doivent :

- vérifier que le rig et l’asset appartiennent au même personnage ;
- mettre à jour `updatedAt` ;
- persister une seule fois par opération métier ;
- ne jamais partager des références d’objet mutables entre deux rigs lors d’une duplication.

## 19. Initialisation additive des assets

`initialize(assets)` doit rester additive et non destructive.

Pour chaque nouvel asset non-corps :

- ne jamais l’ajouter à un rig si sa clé est dans `excludedPartKeys` ;
- ne jamais réactiver une catégorie désactivée ;
- si la catégorie est active et que la politique actuelle d’ajout automatique est conservée, ajouter la pièce sans surcharge afin qu’elle hérite du template ;
- ne jamais remplacer l’élément par défaut existant ;
- ne jamais écraser un template ou une surcharge existante.

Pour chaque nouveau corps :

- créer un nouveau rig ;
- initialiser `bodyCalibration` depuis l’ancien `Asset.calibration` ou l’identité ;
- créer les catégories configurables avec `enabled: true` par défaut ;
- associer les pièces selon la politique d’initialisation existante.

## 20. Tests obligatoires

### 20.1 Store et modèle

- crée un rig par corps ;
- exclut le corps de `parts` ;
- crée le premier template de catégorie ;
- fait hériter plusieurs pièces du même template ;
- crée une surcharge sans modifier les autres pièces ;
- réinitialise une surcharge vers le template ;
- modifier le template propage la valeur aux pièces héritées ;
- modifier le template ne change pas les surcharges ;
- désactiver une catégorie rend toutes ses pièces incompatibles au runtime ;
- réactiver une catégorie restaure les données dormantes ;
- `initialize()` ne réactive pas une catégorie ;
- duplique une configuration sans remplacer le corps cible ;
- une duplication ne partage aucune référence mutable ;
- exporte et réimporte toutes les données v3 ;
- migre correctement un catalogue v2.

### 20.2 Runtime

- une pièce compatible remplace uniquement son slot ;
- une pièce d’une catégorie désactivée ne peut pas être appliquée au rig courant ;
- une pièce compatible ailleurs provoque un changement complet de rig ;
- une pièce incompatible partout ne modifie rien ;
- activer un rig omet les catégories désactivées ;
- activer un rig utilise les templates et surcharges effectifs ;
- dupliquer puis activer le rig cible utilise immédiatement la nouvelle configuration.

### 20.3 Interface

- le sélecteur de catégorie ne contient pas `body` ;
- le toggle de catégorie désactive les contrôles associés ;
- les badges template/hérité/personnalisé sont exacts ;
- Réinitialiser supprime la surcharge ;
- la modale de copie exclut le rig courant ;
- la confirmation de copie est obligatoire ;
- fermer le panneau sauvegarde le brouillon ;
- le panneau reste une colonne sœur du viewport et ne recouvre pas le canvas.

### 20.4 Non-régression

- les personnages complets `character_full` restent indépendants des rigs ;
- les transformations de groupe personnage continuent de s’appliquer au rig assemblé ;
- le foreground reste devant tous les personnages ;
- l’import/export de scène reste valide ;
- le factory reset supprime toutes les versions du catalogue.

## 21. Ordre d’implémentation recommandé

1. Ajouter les types v3 et les fonctions pures de résolution.
2. Ajouter le parser v3 et la migration v2 → v3 avec tests.
3. Faire évoluer le store : catégories, héritage, reset et duplication.
4. Adapter `useRigRuntime` et `applyCharacterRig` aux catégories actives.
5. Adapter `RigCalibrationWorkspace` au brouillon local et aux calibrations effectives.
6. Modifier le panneau UI : catégorie sans corps, toggle, badges et bouton de copie.
7. Ajouter la modale de sélection/confirmation de duplication.
8. Adapter `StageCanvas` à la sauvegarde du brouillon plutôt qu’à l’écriture directe dans l’asset.
9. Mettre à jour import/export, factory reset et version de scène.
10. Ajouter les tests de non-régression et lancer toutes les portes de qualité.

## 22. Portes de qualité

Après implémentation :

```powershell
pnpm.cmd run typecheck
pnpm.cmd exec eslint src vite.config.ts histoire.config.ts
pnpm.cmd run test:unit -- --run
pnpm.cmd run build
pnpm.cmd run story:build
git diff --check
```

Effectuer également un contrôle visuel interactif lorsque le navigateur de test est disponible :

- panneau ouvert sur une largeur réduite ;
- canvas toujours manipulable ;
- corps avec bras intégrés ;
- catégorie de bras désactivée ;
- héritage entre plusieurs têtes ;
- surcharge d’une tête ;
- duplication d’un rig ;
- sélection d’une pièce forçant un changement de rig.

## 23. Critères d’acceptation globaux

La refonte est terminée lorsque :

- le corps définit seul l’identité du rig ;
- le corps n’apparaît plus dans la collection compatible ;
- chaque catégorie non-corps peut être activée ou désactivée par rig ;
- une catégorie désactivée ne produit aucun élément dans le viewport ;
- le premier placement crée un template réutilisé par la catégorie ;
- une pièce peut surcharger ce template sans affecter les autres ;
- Réinitialiser restaure l’héritage ;
- la duplication remplace toute la configuration non-corps du rig cible après confirmation ;
- choisir un asset compatible remplace seulement son slot ;
- choisir un asset d’un autre rig active ce rig complet ;
- fermer le calibreur sauvegarde le travail ;
- l’export/import v3 est portable entre installations ;
- la migration v2 ne perd aucune calibration existante ;
- tous les tests et builds sont verts.

## 24. Points à ne pas réinterpréter

- Ne pas créer un rig par combinaison de tête, bras ou accessoire : un rig est défini uniquement par son corps.
- Ne pas utiliser les dimensions du corps comme dimensions du canevas canonique.
- Ne pas réintroduire une calibration globale unique par asset.
- Ne pas supprimer les données d’une catégorie simplement parce qu’elle est désactivée.
- Ne pas laisser `initialize()` annuler les exclusions ou toggles de l’utilisateur.
- Ne pas faire passer le formulaire du calibreur au-dessus du canvas.
- Ne pas demander de confirmation lors du changement automatique de rig depuis la bibliothèque ; la confirmation est réservée à la duplication destructive.
- Ne pas considérer l’auto-calibration comme anatomiquement fiable sans validation visuelle.
