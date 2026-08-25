---
name: headless-prototyping
description: Intégration d'excellence pour Reka UI (anciennement Radix Vue) et styling glassmorphism de Tailwind CSS v4. Active cette skill lors de la création d'un composant UI.
alwaysApply: false
---

# Skill: Prototypage Headless & Design System

Cette skill dicte l'assemblage et le styling d'excellence pour nos composants d'interface Vue 3.5.

## Directives d'Implémentation Vue 3.5+
- **Prop Forwarding :** Utilise `useForwardPropsEmits` de Reka UI pour déléguer proprement les attributs d'accessibilité (ARIA) et les écouteurs d'événements au composant HTML sous-jacent.
- **Accès DOM :** Utilise exclusivement la macro `useTemplateRef()` pour typer et interagir avec les éléments natifs du DOM.
- **Identifiants Stables :** Utilise la macro native `useId()` de Vue 3.5 pour lier les labels et descriptions d'accessibilité :
  ```typescript
  const id = useId()