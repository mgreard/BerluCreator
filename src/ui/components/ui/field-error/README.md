# FieldError

Composant d'affichage de message d'erreur de champ de formulaire avec transition animée, accessibilité dynamique (`role="alert"`, `aria-live="polite"`), icône d'avertissement et support de texte ou slot riche.

---

## Fonctionnalités

- **Accessibilité Native :** Annonce automatique par les lecteurs d'écran via `role="alert"` et `aria-live="polite"`.
- **Transitions Fluides :** Animation discrète d'apparition / disparition (`opacity`, `translate-y`).
- **Support Flexible :** Accepte une chaîne directe via la prop `error` ou du balisage enrichi via le slot par défaut.

---

## Props

| Prop    | Type                | Défaut      | Description                              |
| :------ | :------------------ | :---------- | :--------------------------------------- |
| `error` | `string \| boolean` | `undefined` | Message d'erreur ou booléen d'affichage  |
| `id`    | `string`            | `undefined` | Identifiant HTML pour `aria-describedby` |
| `class` | `string`            | `undefined` | Classes CSS complémentaires              |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { FieldError } from '@/components/ui/field-error'
</script>

<template>
  <FieldError id="email-error" error="Adresse email requise" />
</template>
```
