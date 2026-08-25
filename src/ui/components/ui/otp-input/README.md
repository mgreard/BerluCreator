# OtpInput

Composant de saisie de code à usage unique (OTP / PIN / 2FA) accessible basé sur les primitives **Reka UI** (`PinInputRoot`, `PinInputInput`), supportant le collage automatique, les masques de mot de passe, le séparateur visuel central, et 4 variantes de style (`default`, `filled`, `bordered`, `glass`).

---

## Fonctionnalités

- **Accessibilité & Navigation Fluide :** Reka UI gère le saut automatique de case à la frappe, le retour arrière avec suppression, le collage global (`paste`) et le focus intelligent.
- **Variantes Stylistiques :**
  - `default` : Surface subtile avec bordure fine et lueur de focus.
  - `filled` : Arrière-plan plein et contrasté.
  - `bordered` : Contour marqué sans fond.
  - `glass` : Effet de verre dépoli réactif (`glass-interactive`).
- **Événements Automatiques :** Émission de l'événement `@complete` dès que toutes les cases sont renseignées.

---

## Props

| Prop          | Type                                             | Défaut                   | Description                     |
| :------------ | :----------------------------------------------- | :----------------------- | :------------------------------ |
| `modelValue`  | `string[] \| string`                             | `''`                     | Code saisi (`v-model`)          |
| `length`      | `number`                                         | `6`                      | Nombre de chiffres / cases      |
| `type`        | `'number' \| 'text' \| 'password'`               | `'number'`               | Type de clavier et saisie       |
| `mask`        | `boolean`                                        | `false`                  | Masque les caractères (puces)   |
| `placeholder` | `string`                                         | `'○'`                    | Symbole de case vide            |
| `disabled`    | `boolean`                                        | `false`                  | Désactive la saisie             |
| `separator`   | `boolean \| string`                              | `false`                  | Séparateur visuel médian (`—`)  |
| `variant`     | `'default' \| 'filled' \| 'bordered' \| 'glass'` | `'default'`              | Variante graphique              |
| `size`        | `'sm' \| 'md' \| 'lg'`                           | `'md'`                   | Taille des cases                |
| `autoFocus`   | `boolean`                                        | `false`                  | Focus automatique à l'affichage |
| `ariaLabel`   | `string`                                         | `'Code de vérification'` | Libellé pour lecteurs d'écran   |
| `class`       | `string`                                         | `undefined`              | Classes CSS complémentaires     |

---

## Emits

| Événement           | Type de payload      | Description                                  |
| :------------------ | :------------------- | :------------------------------------------- |
| `complete`          | `string`             | Émis quand la totalité des cases est remplie |
| `change`            | `string`             | Émis à chaque modification de case           |
| `update:modelValue` | `string[] \| string` | Émis pour la mise à jour du v-model          |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { OtpInput } from '@/components/ui/otp-input'

const otpCode = ref('')

function handleComplete(code: string) {
  console.log('Code 2FA validé :', code)
}
</script>

<template>
  <OtpInput v-model="otpCode" :length="6" separator @complete="handleComplete" />
</template>
```
