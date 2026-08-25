---
name: refacto-colocalisation
description: Guide de refactorisation et migration d'un composant existant vers l'architecture colocalisée autonome (types.ts, SFC, story Histoire, spec Vitest, README.md, index.ts).
alwaysApply: false
---

# Skill : Refactorisation vers la Colocalisation

Cette skill guide l'agent dans la migration pas-à-pas d'un composant existant vers une structure colocalisée moderne, sans introduire de régression ni casser la rétrocompatibilité des imports.

---

## 1. Protocole de Migration

Lorsqu'on demande de refactoriser ou migrer un composant existant :

1. **Localiser l'existant :** Repérer le composant SFC et son fichier de test.
2. **Créer le dossier colocalisé :** `src/components/ui/<component-name>/`.
3. **Extraire `types.ts` :**
   - Transférer les interfaces `Props`, `Emits`, `Slots` et types dérivés.
   - S'assurer que le fichier ne contient que des types statiques.
4. **Adapter le SFC `<ComponentName>.vue` :**
   - Importer les types depuis `./types`.
   - Maintenir les variantes CVA locales.
   - Vérifier la conformité Vue 3.5+ (destructuration réactive, `defineModel`, `useTemplateRef`).
5. **Générer la Story Histoire `<ComponentName>.story.vue` :**
   - Exposer toutes les variantes visuelles.
   - Fournir un playground avec les contrôles Histoire (`HstSelect`, `HstCheckbox`, etc.).
6. **Migrer et ajuster le test `<ComponentName>.spec.ts` :**
   - Mettre à jour les chemins d'import relatifs.
7. **Rédiger `README.md` :**
   - Description, exemples, tableau des Props/Emits/Slots.
8. **Créer le Barrel `index.ts` local :**
   - `export { default as <ComponentName> } from './<ComponentName>.vue'`
   - `export * from './types'`
9. **Maintenir la compatibilité :**
   - Conserver ou aliasser les exports dans les barrels intermédiaires et `src/index.ts`.

---

## 2. Validation
- Vérifier `pnpm typecheck` et `pnpm test:unit` sur le composant migré.
