# Drawer

Composant de panneau latéral ou tiroir coulissant (Sheet / Drawer / Bottom Sheet) basé sur **Reka UI** (`DialogRoot`, `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogClose`).

---

## Fonctionnalités

- **4 Côtés d'Apparition (`side`) :** `right` (volet latéral droit), `left` (menu de navigation gauche), `bottom` (bottom sheet mobile avec poignée tactile de tirage), `top` (bannière haute).
- **Échelle de Dimensions (`size`) :** `sm`, `md`, `lg`, `xl`, `full`.
- **Transitions Fluides :** Glissements cinématiques calibrés via Tailwind CSS v4 et animations CSS matérielles.
- **Accessibilité :** Focus trap natif, fermeture par clic d'overlay ou touche `Échap`.

---

## Props

| Prop          | Type                                     | Défaut      | Description                                  |
| :------------ | :--------------------------------------- | :---------- | :------------------------------------------- |
| `open`        | `boolean`                                | `false`     | État d'ouverture (`v-model:open`)            |
| `title`       | `string`                                 | `undefined` | Titre dans l'en-tête                         |
| `description` | `string`                                 | `undefined` | Sous-titre dans l'en-tête                    |
| `side`        | `'top' \| 'right' \| 'bottom' \| 'left'` | `'right'`   | Côté d'apparition                            |
| `size`        | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'`      | Dimension du panneau                         |
| `modal`       | `boolean`                                | `true`      | Bloque les interactions en arrière-plan      |
| `portal`      | `boolean`                                | `true`      | Téléporte dans `document.body`               |
| `showClose`   | `boolean`                                | `true`      | Affiche le bouton de fermeture               |
| `disabled`    | `boolean`                                | `false`     | Désactive le déclencheur                     |
| `class`       | `string`                                 | `undefined` | Classes CSS complémentaires sur le conteneur |

---

## Emits

| Événement     | Type de payload | Description                           |
| :------------ | :-------------- | :------------------------------------ |
| `open`        | `void`          | Émis à l'ouverture                    |
| `close`       | `void`          | Émis à la fermeture                   |
| `update:open` | `boolean`       | Émis lors de la mise à jour de l'état |

---

## Slots

| Slot      | Scope                                   | Description                     |
| :-------- | :-------------------------------------- | :------------------------------ |
| `trigger` | `{ open: boolean, toggle: () => void }` | Déclencheur                     |
| `default` | -                                       | Corps du tiroir                 |
| `header`  | -                                       | En-tête personnalisé            |
| `footer`  | -                                       | Pied de page (boutons d'action) |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'

const isDrawerOpen = ref(false)
</script>

<template>
  <Button @click="isDrawerOpen = true">Ouvrir le panneau</Button>

  <Drawer
    v-model:open="isDrawerOpen"
    title="Filtres du catalogue"
    description="Sélectionnez vos critères de recherche"
    side="right"
    size="md"
  >
    <div class="flex flex-col gap-4">
      <!-- Options de filtrage -->
    </div>

    <template #footer>
      <Button variant="secondary" @click="isDrawerOpen = false">Réinitialiser</Button>
      <Button variant="primary" @click="isDrawerOpen = false">Appliquer</Button>
    </template>
  </Drawer>
</template>
```
