---
description: 
---

---
name: atomic-design-refactor
description: Procédure sécurisée pour extraire et refactoriser du code monolithique vers notre architecture de composants UI atomiques.
---

# Workflow de Refactoring Atomic Design

## Objectif
Nettoyer les fichiers monolithiques de la couche `features/` en identifiant, extrayant et isolant les briques réutilisables dans `components/ui/` selon nos standards technologiques.

## Étapes de Refactorisation

1. **Audit de l'existant :**
   - Analyse le composant cible (ex: un formulaire complexe dans une vue de tableau de bord).
   - Identifie les éléments d'interface répétés (boutons, champs, commutateurs, cartes de verre).

2. **Extraction des Primitives de Style :**
   - Extrais le balisage HTML et les classes Tailwind CSS vers un nouveau sous-dossier `src/components/ui/<new-component>/`.
   - Remplace les styles arbitraires par nos utilitaires de thémage et de verre premium.

3. **Migration vers Vue 3.5 :**
   - Convertis l'ancien boilerplate de liaison (props/emits manuels) vers le macro `defineModel()` pour les liaisons bidirectionnelles.
   - Injecte `useTemplateRef()` pour tout ciblage de nœud DOM.

4. **Séparation Hermétique des Données :**
   - Valide que le composant UI extrait ne contient aucun appel asynchrone direct (interdiction de `useQuery` / `useMutation` dans le composant d'interface).
   - Toutes les actions et données serveur doivent être injectées depuis le composant parent ou gérées via un composable métier colocalisé dans `features/`.

5. **Validation et Test de Remplacement :**
   - Remplace le code monolithique d'origine par votre nouvelle primitive UI dans la vue métier parent.
   - Lance `pnpm test` et `pnpm playwright test` pour s'assurer qu'aucun parcours utilisateur n'est rompu.

## End State
Le refactoring est validé lorsque le composant monolithique d'origine a été allégé, que le composant UI extrait est 100% autonome dans `src/components/ui/`, et que l'ensemble des tests de non-régression est au vert ✅.