# 🎨 Workflow : Migration Scoped CSS vers Tailwind CSS v4

Ce workflow décrit la procédure unitaire pour convertir un composant existant de Scoped CSS vers **Tailwind CSS v4** et **`cn()`**.

---

## Étapes de Migration Unitaire

### Étape 1 : Analyse des Styles Existants
- Identifier les sélecteurs Scoped CSS du composant (classes de base, variants, tailles, pseudo-classes `:hover`, `:focus`, `:active`, transitions, animations).
- Noter les variables CSS utilisées (`var(--color-...)`, `var(--radius-...)`, etc.).

### Étape 2 : Conversion vers Tailwind CSS v4 & `cn()`
- Importer le helper `cn` depuis `@/shared/utils/cn`.
- Ajouter la prop optionnelle `class?: string` dans l'interface de Props.
- Remplacer les classes CSS ad-hoc dans le template par les classes utilitaires calculées via `cn()`.
- Mapper les styles de variants (`variant`, `size`, `disabled`, `loading`) avec les classes Tailwind correspondantes.

### Étape 3 : Nettoyage du Bloc `<style scoped>`
- Supprimer tout le code CSS redondant désormais pris en charge par Tailwind.
- Conserver uniquement d'éventuelles animations personnalisées complexes ou pseudo-éléments `@keyframes` très spécifiques si non couverts par Tailwind v4.

### Étape 4 : Validation
- Vérifier la conformité du rendu visuel et l'absence de régression.
- Mettre à jour le tableau de suivi `implementation_plan.md`.
