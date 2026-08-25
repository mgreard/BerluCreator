# TopHeaderBar

Barre d'en-tête et de commande harmonisée (Command Bar / Top Navigation Bar) avec surface opaque par défaut, variante glass optionnelle, responsivité et composition via slots (`left`, `center`, `right`).

## 📦 Importation

```vue
<script setup lang="ts">
import { TopHeaderBar, SegmentedControl, Button, Icon } from 'my-comp-lib'
</script>
```

## 🛠️ Usage basique

```vue
<TopHeaderBar>
  <template #left>
    <SegmentedControl
      v-model="activeTab"
      size="sm"
      :options="[
        { value: 'view1', label: 'Vue 1', icon: 'auto_stories' },
        { value: 'view2', label: 'Vue 2', icon: 'category' }
      ]"
    />
  </template>

  <template #right>
    <Button variant="secondary" size="sm" shape="rounded">
      <Icon name="add" size="xs" /> Action
    </Button>
  </template>
</TopHeaderBar>
```

## ⚙️ Props

| Prop      | Type                                            | Défaut      | Description                                            |
| :-------- | :---------------------------------------------- | :---------- | :----------------------------------------------------- |
| `as`      | `string`                                        | `'header'`  | Tag HTML ou composant cible                            |
| `variant` | `'glass' \| 'solid' \| 'flat' \| 'transparent'` | `'solid'`   | Variante visuelle du conteneur                         |
| `sticky`  | `boolean`                                       | `false`     | Rendre la barre collante en haut (`sticky top-0 z-30`) |
| `class`   | `string`                                        | `undefined` | Classes CSS Tailwind supplémentaires                   |

## 🧩 Slots

- `#left` ou `#default` : Contenu aligné à gauche (généralement un sélecteur d'onglets `SegmentedControl` ou un titre de page).
- `#center` : Contenu centré (optionnel).
- `#right` ou `#actions` : Boutons d'action et commandes contextuelles.
