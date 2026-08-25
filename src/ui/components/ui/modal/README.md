# Modal

Composant de boîte de dialogue modale accessible basé sur **Reka UI** (`DialogRoot`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogClose`), conforme aux directives WAI-ARIA (piégeage du focus, fermeture par touche `Échap`, masquage d'arrière-plan).

---

## Fonctionnalités

- **Accessibilité Rigoureuse :** Focus trap natif, gestion automatique des balises `aria-labelledby` et `aria-describedby` avec `VisuallyHidden` de secours.
- **Surface lisible par défaut :** Carte opaque, bordure nette et overlay sombre sans flou.
- **Glassmorphism optionnel :** La variante `surface="glass"` conserve le traitement vitré pour les contextes adaptés.
- **Tailles Flexibles :** Échelle de dimensions (`sm`, `md`, `lg`, `xl`, `fullscreen`).
- **Support Double V-Model :** Compatible `v-model` et `v-model:isOpen`.
- **Empilement explicite :** Le même `zIndex` est appliqué à l'overlay et au dialogue.
- **Attributs natifs :** Les attributs `aria-*`, `data-*`, `style` et les événements natifs sont transmis au `DialogContent`.

---

## Props

| Prop                    | Type                                           | Défaut      | Description                                     |
| :---------------------- | :--------------------------------------------- | :---------- | :---------------------------------------------- |
| `modelValue` / `isOpen` | `boolean`                                      | `false`     | État d'ouverture (`v-model`)                    |
| `title`                 | `string`                                       | `undefined` | Titre principal                                 |
| `subtitle`              | `string`                                       | `undefined` | Sous-titre descriptif                           |
| `size`                  | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'fullscreen'` | `'md'`      | Taille de la modale                             |
| `surface`               | `'solid' \| 'glass'`                           | `'solid'`   | Traitement visuel de la carte                   |
| `closeOnBackdrop`       | `boolean`                                      | `true`      | Fermeture lors du clic sur l'overlay sombre     |
| `zIndex`                | `number`                                       | `1100`      | Niveau d'empilement de l'overlay et du dialogue |
| `class`                 | `string`                                       | `undefined` | Classes CSS complémentaires sur la carte        |

---

## Emits

| Événement | Type de payload | Description         |
| :-------- | :-------------- | :------------------ |
| `open`    | `void`          | Émis à l'ouverture  |
| `close`   | `void`          | Émis à la fermeture |

---

## Slots

| Slot      | Description                     |
| :-------- | :------------------------------ |
| `default` | Contenu principal               |
| `header`  | En-tête personnalisé            |
| `footer`  | Pied de page (boutons d'action) |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

const isModalOpen = ref(false)
</script>

<template>
  <Button @click="isModalOpen = true">Ouvrir</Button>

  <Modal
    v-model="isModalOpen"
    title="Confirmation"
    subtitle="Voulez-vous poursuivre cette opération ?"
    size="sm"
  >
    <p>Cette action ne pourra pas être annulée.</p>

    <template #footer>
      <Button variant="secondary" @click="isModalOpen = false">Annuler</Button>
      <Button variant="primary" @click="isModalOpen = false">Confirmer</Button>
    </template>
  </Modal>
</template>
```
