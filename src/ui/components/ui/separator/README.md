# Separator

Composant de séparation visuelle ou sémantique basé sur **Reka UI** (`Separator`), supportant les orientations horizontales et verticales, l'incrustation de texte (`label`) et plusieurs variantes de bordures.

---

## Fonctionnalités

- **Orientations :** `horizontal` (défaut, pleine largeur `h-[1px]`) et `vertical` (pleine hauteur `w-[1px]`).
- **Libellé Incrusté :** Insère un texte ou slot au centre, au début ou à la fin (`labelAlign="start | center | end"`).
- **Variantes Visuelles :** `default` (bordure standard), `subtle` (semi-transparente), `gradient` (dégradé fondu) et `dashed` (ligne pointillée).
- **Accessibilité :** Gestion de l'attribut `decorative` (pour masquer aux lecteurs d'écran) ou `role="separator"` sémantique.

---

## Props

| Prop          | Type                                              | Défaut         | Description                                |
| :------------ | :------------------------------------------------ | :------------- | :----------------------------------------- |
| `orientation` | `'horizontal' \| 'vertical'`                      | `'horizontal'` | Orientation de la ligne                    |
| `decorative`  | `boolean`                                         | `true`         | Purement décoratif pour les screen readers |
| `variant`     | `'default' \| 'subtle' \| 'gradient' \| 'dashed'` | `'default'`    | Variante visuelle                          |
| `label`       | `string`                                          | `undefined`    | Libellé textuel incrusté                   |
| `labelAlign`  | `'start' \| 'center' \| 'end'`                    | `'center'`     | Positionnement du libellé                  |
| `class`       | `string`                                          | `undefined`    | Classes CSS complémentaires                |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { Separator } from '@/components/ui/separator'
</script>

<template>
  <!-- Séparateur horizontal standard -->
  <Separator />

  <!-- Séparateur avec libellé -->
  <Separator label="OU" />

  <!-- Séparateur vertical dans une barre d'actions -->
  <div class="flex items-center h-8 gap-3">
    <button>Action 1</button>
    <Separator orientation="vertical" />
    <button>Action 2</button>
  </div>
</template>
```
