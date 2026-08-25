---
name: refacto-colocalisation
description: Procédure de migration pas-à-pas d'un composant existant depuis un dossier groupé vers une architecture colocalisée autonome (types, story, tests, doc, index).
---

# Workflow de Refactorisation vers la Colocalisation

## Objectif
Migrer un composant existant de la librairie vers une architecture modulaire et colocalisée (1 dossier dédié par composant) sans casser la rétrocompatibilité des imports existants.

---

## Étapes de Migration d'un Composant

### 1. Audit Préalable du Composant
* Identifier le fichier SFC source (ex: `src/shared/components/ui/buttons/AppButton.vue`) et son test existant (`AppButton.spec.ts`).
* Identifier les types, props, emits et variantes CVA déclarés dans le SFC.

---

### 2. Création du Répertoire Cible
* Créer le répertoire dédié sous `src/components/ui/<component-name>/` (en kebab-case, ex: `src/components/ui/button/`).

---

### 3. Extraction du Contrat d'Interface (`types.ts`)
* Déplacer toutes les interfaces de Props, Emits, Slots et types utilitaires dans `types.ts`.
* Garder uniquement les types statiques (`export interface`, `export type`).
* Vérifier qu'aucun code runtime (`const`, `function`, `cva`) n'est présent dans `types.ts`.

---

### 4. Refactorisation du SFC (`<ComponentName>.vue`)
* Déplacer/Créer le fichier SFC dans le nouveau répertoire.
* Importer les types depuis `./types`.
* Assurer la conformité Vue 3.5+ :
  - `<script setup lang="ts">` strict.
  - Déstructuration réactive des props avec valeurs par défaut littérales.
  - Utilisation de `defineModel<T>()` si applicable.
  - Maintien des variantes `cva()` en local sans export runtime (`export type <ComponentName>Variants = VariantProps<typeof variants>`).

---

### 5. Création de la Story Histoire (`<ComponentName>.story.vue`)
* Générer la story Histoire documentant :
  - Toutes les variantes visuelles en grille.
  - Un playground interactif avec `HstSelect`, `HstCheckbox`, etc.

---

### 6. Migration et Enrichissement des Tests (`<ComponentName>.spec.ts`)
* Déplacer le fichier de test unitaire existant dans le nouveau dossier.
* Mettre à jour les chemins d'import vers le SFC et `types.ts` locaux.
* Compléter si besoin les scénarios de test (WAI-ARIA, états interactifs, slots).

---

### 7. Documentation Locale (`README.md`)
* Rédiger un fichier `README.md` synthétique contenant :
  - Description du composant.
  - Tableau des Props, Emits et Slots.
  - Exemple d'intégration Vue 3.5.
  - Directives d'accessibilité ARIA.

---

### 8. Barrels & Rétrocompatibilité
* Créer le fichier `index.ts` local :
  ```typescript
  export { default as <ComponentName> } from './<ComponentName>.vue'
  export * from './types'
  ```
* Mettre à jour le barrel intermédiaire (ex: `src/components/ui/index.ts` et `src/shared/components/ui/index.ts`) pour réexporter le nouveau composant.
* Vérifier qu'aucune rupture d'import n'affecte `src/index.ts` ni les vitrines/tests de l'application.

---

## Validation Post-Migration
1. Vérification TypeScript : `pnpm typecheck` (0 erreur).
2. Lancement des tests unitaires : `pnpm test:unit` (100% de succès sur le composant migré).
3. Contrôle visuel dans Histoire : `pnpm story` pour vérifier le rendu et les contrôles interactifs.
