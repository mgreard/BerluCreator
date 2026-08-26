# Button

Composant interactif polyvalent, hautement accessible (WAI-ARIA), supportant les états de chargement asynchrones, le polymorphisme (`as`, `asChild`, `to`, `href`), et les variantes graphiques Glassmorphic de Tailwind CSS v4.

---

## Fonctionnalités

- **Variantes visuelles :** `primary`, `secondary`, `accent`, `ghost`, `destructive`.
- **Formes & Tailles :** Forme pilule (`pill`) ou arrondie (`rounded`), tailles `xs`, `sm`, `md`, `lg`. La taille `xs` conserve une cible tactile virtuelle de 44 px.
- **Support asynchrone :** Spinner intégré avec transition douce et option de texte contextuel `loadingText`.
- **Polymorphisme & Routage :** Rendu automatique en `<a>` si `href` est renseigné, ou avec le `<RouterLink>` enregistré par l’application si `to` est renseigné. Sans Vue Router, une cible `to` textuelle produit un lien `<a href>` fonctionnel.

---

## Props

| Prop          | Type                                                              | Défaut      | Description                                  |
| :------------ | :---------------------------------------------------------------- | :---------- | :------------------------------------------- |
| `variant`     | `'primary' \| 'secondary' \| 'accent' \| 'ghost' \| 'destructive'`| `'primary'` | Variante visuelle du bouton                  |
| `size`        | `'xs' \| 'sm' \| 'md' \| 'lg'`                         | `'md'`      | Taille et espacement                         |
| `shape`       | `'pill' \| 'rounded'`                                  | `'pill'`    | Forme des coins                              |
| `disabled`    | `boolean`                                              | `false`     | Désactive les clics et configure ARIA        |
| `loading`     | `boolean`                                              | `false`     | Affiche l'animation de chargement            |
| `loadingText` | `string`                                               | `undefined` | Texte d'état dynamique pendant le chargement |
| `type`        | `'button' \| 'submit' \| 'reset'`                      | `'button'`  | Type d'élément de formulaire natif           |
| `to`          | `string \| Record<string, unknown>`                    | `undefined` | Cible de navigation Vue Router               |
| `href`        | `string`                                               | `undefined` | URL externe native                           |
| `as`          | `string \| Component`                                  | `'button'`  | Surcharge de la balise HTML                  |
| `asChild`     | `boolean`                                              | `false`     | Rendu headless délégué à l'élément enfant    |
| `class`       | `string`                                               | `undefined` | Classes CSS additionnelles                   |

---

## Emits

| Événement | Type de payload | Description                                                        |
| :-------- | :-------------- | :----------------------------------------------------------------- |
| `click`   | `MouseEvent`    | Émis lors du clic si le bouton n'est ni désactivé ni en chargement |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
</script>

<template>
  <!-- Bouton d'action principal -->
  <Button variant="primary" shape="pill" @click="handleSave"> Enregistrer </Button>

  <!-- Bouton en chargement avec label contextuel -->
  <Button :loading="isSubmitting" loadingText="Envoi en cours..."> Soumettre </Button>

  <!-- Bouton destructif -->
  <Button variant="destructive" @click="handleDelete"> Supprimer l'élément </Button>
</template>
```
