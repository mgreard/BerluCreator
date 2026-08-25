# ToastContainer

Composant d'affichage global des notifications toasts réactives, rendu via `<Teleport to="body">` avec animations d'apparition/disparition `<TransitionGroup>`, bordures translucides et support complet de l'accessibilité WAI-ARIA (`aria-live="polite"`, `aria-atomic="true"`).

---

## Fonctionnalités

- **Rendu dans le DOM racine :** Téléportation automatique vers `document.body`.
- **Transitions physiques :** Entrée fluide depuis la droite et sortie avec fondu vers le bas.
- **Support multi-types :** Styles dédiés pour `info`, `success`, `warning`, `error`.
- **Service découplé :** Déclenché automatiquement via `toast.success()`, `toast.error()`, `toast.info()`, `toast.warning()`.
- **Empilement global :** La couche `zIndex` vaut `10000` par défaut afin de rester visible au-dessus des dialogues.

---

## Props

| Prop     | Type     | Défaut      | Description                                       |
| :------- | :------- | :---------- | :------------------------------------------------ |
| `zIndex` | `number` | `10000`     | Niveau d'empilement du conteneur fixe             |
| `class`  | `string` | `undefined` | Classes CSS complémentaires sur le conteneur fixe |

---

## Exemple d'utilisation

```vue
<!-- App.vue (Point d'entrée de l'application) -->
<script setup lang="ts">
import { ToastContainer } from '@/components/ui/toast-container'
import { toast } from '@/shared/services/toast.service'

function handleClick() {
  toast.success('Félicitations', 'Votre compte a été activé.')
}
</script>

<template>
  <button @click="handleClick">Déclencher Toast</button>
  <ToastContainer />
</template>
```
