# FormGroup

Composant conteneur de champ de formulaire unifié, orchestrant le libellé (`<label>`), l'indicateur d'obligation (`*`), les messages d'aide, les erreurs animées (`FieldError`) et les dispositions verticale ou en ligne (`inline`).

---

## Fonctionnalités

- **Structure Standardisée :** Lie automatiquement les labels et les contrôles de formulaire.
- **Gestion des Erreurs Intégrée :** Bascule automatiquement entre le texte d'aide (`helperText`) et le message d'erreur (`FieldError`).
- **Dispositions Multiples :** Support du mode vertical standard et du mode horizontal (`inline`) pour les interrupteurs ou cases à cocher.
- **Slots Flexibles :** Slots `label`, `extra`, `default`, `helper` et `error`.

---

## Props

| Prop         | Type                | Défaut      | Description                               |
| :----------- | :------------------ | :---------- | :---------------------------------------- |
| `label`      | `string`            | `undefined` | Libellé textuel du champ                  |
| `labelFor`   | `string`            | `undefined` | Attribut `for` reliant le label à l'input |
| `required`   | `boolean`           | `false`     | Affiche l'astérisque rouge `*`            |
| `error`      | `string \| boolean` | `undefined` | Message ou état d'erreur                  |
| `helperText` | `string`            | `undefined` | Texte d'explication sous le champ         |
| `disabled`   | `boolean`           | `false`     | Atténue l'opacité du groupe               |
| `inline`     | `boolean`           | `false`     | Disposition côte-à-côte                   |
| `class`      | `string`            | `undefined` | Classes CSS complémentaires               |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { FormGroup } from '@/components/ui/form-group'
import { Input } from '@/components/ui/input'

const username = ref('')
</script>

<template>
  <FormGroup
    label="Nom d'utilisateur"
    label-for="username-input"
    required
    helper-text="3 à 20 caractères."
  >
    <Input id="username-input" v-model="username" />
  </FormGroup>
</template>
```
