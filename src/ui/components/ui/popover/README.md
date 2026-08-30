# Popover

Composant d'affichage de contenu flottant riche et interactif ancré à un déclencheur, basé sur les primitives **Reka UI** (`PopoverRoot`, `PopoverTrigger`, `PopoverContent`, `PopoverPortal`, `PopoverArrow`, `PopoverClose`).

---

## Fonctionnalités

- **Conteneur Riche & Structuré :** Support d'un en-tête (`title`, `description`, `#header`), d'un corps avec défilement fluide et d'un pied de page (`#footer`).
- **Positionnement Avancé :** Support des côtés (`top`, `right`, `bottom`, `left`), alignements (`start`, `center`, `end`), décalages et largeurs prédéfinies (`sm`, `md`, `lg`, `xl`, `trigger`, `auto`).
- **Portal configurable :** Téléportation vers `body` ou une cible `string | HTMLElement`, avec résolution différée Vue 3.5.
- **Collisions maîtrisées :** Position fixe par défaut, marge de 8 px, comportement sticky et masquage lorsque le déclencheur disparaît.
- **Contrôle Réactif :** Binding bidirectionnel `v-model` (`modelValue`), support du mode modal (`modal`) et flèche d'ancrage (`arrow`).
- **Fermeture Intelligente :** Bouton de fermeture intégré dans l'en-tête ou bouton flottant si aucun titre n'est spécifié.
- **Surface explicite :** Fond opaque `solid` par défaut ; glassmorphism disponible via `surface="glass"`.

---

## Props

| Prop          | Type                                                            | Défaut      | Description                                |
| :------------ | :-------------------------------------------------------------- | :---------- | :----------------------------------------- |
| `modelValue`  | `boolean`                                                       | `false`     | État d'ouverture (`v-model`)               |
| `title`       | `string`                                                        | `undefined` | Titre dans l'en-tête                       |
| `description` | `string`                                                        | `undefined` | Sous-titre dans l'en-tête                  |
| `side`        | `'top' \| 'right' \| 'bottom' \| 'left'`                        | `'bottom'`  | Côté d'affichage                           |
| `align`       | `'start' \| 'center' \| 'end'`                                  | `'center'`  | Alignement par rapport au déclencheur      |
| `sideOffset`  | `number`                                                        | `8`         | Décalage en pixels                         |
| `width`       | `'auto' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'trigger' \| string` | `'md'`      | Largeur du popover                         |
| `surface`     | `'solid' \| 'glass'`                                            | `'solid'`   | Traitement visuel du popover               |
| `arrow`       | `boolean`                                                       | `false`     | Affiche la flèche d'ancrage                |
| `modal`       | `boolean`                                                       | `false`     | Mode modal (capture le focus)              |
| `portal`      | `boolean`                                                       | `true`      | Téléporte dans `document.body`             |
| `portalTo`    | `string \| HTMLElement`                                         | `'body'`    | Cible native du Teleport Reka              |
| `portalDefer` | `boolean`                                                       | `true`      | Diffère la résolution de la cible           |
| `avoidCollisions` | `boolean`                                                   | `true`      | Active le repositionnement automatique      |
| `collisionBoundary` | `Element \| (Element \| null)[] \| null`                 | `undefined` | Limite utilisée pour les collisions         |
| `collisionPadding` | `number \| Partial<Record<PopoverSide, number>>`           | `8`         | Marge avec les limites                      |
| `positionStrategy` | `'fixed' \| 'absolute'`                                    | `'fixed'`   | Stratégie CSS de positionnement             |
| `sticky`      | `'partial' \| 'always'`                                        | `'partial'` | Maintien dans les limites                   |
| `hideWhenDetached` | `boolean`                                                  | `true`      | Masque si le trigger disparaît              |
| `ignoreOutsideInteractionSelector` | `string`                                      | `undefined` | Conserve le popover ouvert pour les interactions extérieures correspondantes |
| `updatePositionStrategy` | `'always' \| 'optimized'`                            | `'optimized'` | Fréquence de recalcul                     |
| `showClose`   | `boolean`                                                       | `true`      | Affiche le bouton de fermeture             |
| `disabled`    | `boolean`                                                       | `false`     | Désactive l'ouverture                      |
| `class`       | `string`                                                        | `undefined` | Classes CSS complémentaires sur le contenu |
| `bodyClass`   | `string`                                                        | `undefined` | Classes du corps scrollable                |

---

## Emits

| Événement | Type de payload | Description         |
| :-------- | :-------------- | :------------------ |
| `open`    | `void`          | Émis à l'ouverture  |
| `close`   | `void`          | Émis à la fermeture |

---

## Slots

| Slot      | Scope                                   | Description                          |
| :-------- | :-------------------------------------- | :----------------------------------- |
| `trigger` | `{ open: boolean, toggle: () => void }` | Déclencheur du popover               |
| `default` | -                                       | Corps principal du popover           |
| `header`  | -                                       | En-tête personnalisé                 |
| `footer`  | -                                       | Pied de page (boutons d'action)      |
| `anchor`  | -                                       | Élément d'ancrage virtuel alternatif |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Popover } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

const isFilterOpen = ref(false)
</script>

<template>
  <Popover
    v-model="isFilterOpen"
    title="Filtres avancés"
    description="Affinez les résultats de recherche"
    width="md"
    :arrow="true"
  >
    <template #trigger>
      <Button variant="secondary">Filtrer</Button>
    </template>

    <div class="flex flex-col gap-2">
      <!-- Contenu du filtre -->
    </div>

    <template #footer>
      <Button size="xs" variant="ghost" @click="isFilterOpen = false">Annuler</Button>
      <Button size="xs" variant="primary" @click="isFilterOpen = false">Appliquer</Button>
    </template>
  </Popover>
</template>
```
