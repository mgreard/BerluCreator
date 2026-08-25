# Switch

Composant d'interrupteur à bascule accessible basé sur **Reka UI** (`SwitchRoot`, `SwitchThumb`), intégrant une animation de transition fluide, la liaison `aria-describedby` automatique via `useId()`, et le respect des zones tactiles.

---

## Fonctionnalités

- **Accessibilité Native :** Rôle `switch`, navigation au clavier (Espace/Entrée), et annonce vocale de l'état `aria-checked`.
- **Liaison `v-model` :** Modèle booléen standardisé avec mise à jour immédiate.
- **Liaison Description Automatique :** Génération de l'ID avec `useId()` pour lier la description d'aide.
- **Attributs natifs :** Les attributs ARIA, `title`, `data-*` et événements non déclarés sont transmis au contrôle interactif `SwitchRoot`.
- **Variantes de Tailles :** `sm`, `md` et `lg`.

---

## Props

| Prop          | Type                   | Défaut      | Description                      |
| :------------ | :--------------------- | :---------- | :------------------------------- |
| `modelValue`  | `boolean`              | `false`     | État actif du switch (`v-model`) |
| `label`       | `string`               | `undefined` | Libellé textuel                  |
| `description` | `string`               | `undefined` | Texte d'aide descriptif          |
| `size`        | `'sm' \| 'md' \| 'lg'` | `'md'`      | Taille du switch                 |
| `disabled`    | `boolean`              | `false`     | Désactive le switch              |
| `id`          | `string`               | `useId()`   | Identifiant HTML                 |
| `name`        | `string`               | `undefined` | Nom du champ de formulaire       |
| `class`       | `string`               | `undefined` | Classes CSS complémentaires      |

---

## Emits

| Événement           | Type de payload | Description                           |
| :------------------ | :-------------- | :------------------------------------ |
| `change`            | `boolean`       | Émis au basculement de l'interrupteur |
| `update:modelValue` | `boolean`       | Émis pour la mise à jour du v-model   |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Switch } from '@/components/ui/switch'

const isWifiEnabled = ref(true)
</script>

<template>
  <Switch
    v-model="isWifiEnabled"
    label="Wi-Fi"
    description="Activer ou désactiver la connexion sans fil."
  />
</template>
```
