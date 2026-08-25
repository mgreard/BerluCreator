# AlertDialog

Composant de boîte de dialogue d'alerte et de confirmation d'action critique / irréversible basé sur **Reka UI** (`AlertDialogRoot`, `AlertDialogTrigger`, `AlertDialogPortal`, `AlertDialogOverlay`, `AlertDialogContent`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`), conforme aux règles d'accessibilité WAI-ARIA (interruption modale impérative, pas de fermeture par clic externe sans action explicite).

---

## Fonctionnalités

- **Variantes Sémantiques :** `danger`, `warning`, `info`, `primary`.
- **Double Sécurité (`requireConfirmationText`) :** Exige la saisie exacte d'un mot-clé (ex: `'SUPPRIMER'`) pour débloquer le bouton de validation des actions destructives.
- **États Réactifs :** Support de `confirmLoading` pour les requêtes asynchrones et `confirmDisabled`.
- **Accessibilité :** Focus piégé et retour au déclencheur, navigation clavier native.

---

## Props

| Prop                      | Type                                           | Défaut        | Description                                         |
| :------------------------ | :--------------------------------------------- | :------------ | :-------------------------------------------------- |
| `open`                    | `boolean`                                      | `false`       | État d'ouverture (`v-model:open`)                   |
| `title`                   | `string`                                       | **Requis**    | Titre de l'alerte                                   |
| `description`             | `string`                                       | `undefined`   | Description / avertissement explicatif              |
| `variant`                 | `'danger' \| 'warning' \| 'info' \| 'primary'` | `'danger'`    | Variante d'alerte                                   |
| `confirmText`             | `string`                                       | `'Confirmer'` | Libellé du bouton de confirmation                   |
| `cancelText`              | `string`                                       | `'Annuler'`   | Libellé du bouton d'annulation                      |
| `icon`                    | `string`                                       | `undefined`   | Surcharge du nom d'icône d'en-tête                  |
| `confirmLoading`          | `boolean`                                      | `false`       | État de chargement                                  |
| `confirmDisabled`         | `boolean`                                      | `false`       | Désactive le bouton d'action                        |
| `requireConfirmationText` | `string`                                       | `undefined`   | Texte que l'utilisateur doit obligatoirement saisir |
| `class`                   | `string`                                       | `undefined`   | Classes CSS complémentaires                         |

---

## Emits

| Événement | Type de payload | Description                |
| :-------- | :-------------- | :------------------------- |
| `confirm` | `void`          | Émis lors de la validation |
| `cancel`  | `void`          | Émis lors de l'annulation  |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

const isAlertOpen = ref(false)
const isDeleting = ref(false)

async function handleDelete() {
  isDeleting.value = true
  // ... appel API
  isDeleting.value = false
  isAlertOpen.value = false
}
</script>

<template>
  <Button variant="destructive" @click="isAlertOpen = true">Supprimer</Button>

  <AlertDialog
    v-model:open="isAlertOpen"
    title="Supprimer la base de données ?"
    description="Cette action est irréversible et supprimera l'intégralité des sauvegardes."
    variant="danger"
    confirmText="Supprimer définitivement"
    requireConfirmationText="SUPPRIMER"
    :confirmLoading="isDeleting"
    @confirm="handleDelete"
  />
</template>
```
