# LightboxModal

Composant d'affichage et prévisualisation d'image grand format en plein écran (Visionneuse Lightbox) basé sur **Reka UI** (`DialogRoot`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogTitle`, `DialogClose`), avec arrière-plan assombri et flouté (`backdrop-blur-md`).

---

## Fonctionnalités

- **Affichage Plein Écran Optimisé :** Conteneur adaptatif préservant le ratio d'aspect de l'image (`max-w-[92vw] max-h-[92vh] object-contain`).
- **Accessibilité Screen Reader :** Balise `DialogTitle` masquée visuellement (`.sr-only`) reprenant automatiquement la légende ou le texte alternatif de l'image.
- **Contrôles Ergonomiques :** Bouton de fermeture tactile semi-transparent en haut à droite avec raccourci `Échap` automatique.
- **Empilement explicite :** Le même `zIndex` est appliqué à l'overlay et au dialogue.

---

## Props

| Prop       | Type      | Défaut      | Description                                     |
| :--------- | :-------- | :---------- | :---------------------------------------------- |
| `open`     | `boolean` | `true`      | État d'ouverture (`v-model:open`)               |
| `imageUrl` | `string`  | **Requis**  | URL source de l'image                           |
| `altText`  | `string`  | `undefined` | Texte alternatif accessible                     |
| `caption`  | `string`  | `undefined` | Légende affichée sous l'image                   |
| `zIndex`   | `number`  | `1000`      | Niveau d'empilement de l'overlay et du dialogue |
| `class`    | `string`  | `undefined` | Classes CSS complémentaires sur le conteneur    |

---

## Emits

| Événement     | Type de payload | Description                    |
| :------------ | :-------------- | :----------------------------- |
| `close`       | `void`          | Émis à la fermeture            |
| `update:open` | `boolean`       | Émis lors du changement d'état |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { LightboxModal } from '@/components/ui/lightbox-modal'

const isPreviewOpen = ref(false)
</script>

<template>
  <button @click="isPreviewOpen = true">Agrandir la photo</button>

  <LightboxModal
    v-model:open="isPreviewOpen"
    imageUrl="/assets/sample-photo.jpg"
    altText="Paysage de montagne"
    caption="Prise de vue panoramique aux Alpes"
  />
</template>
```
