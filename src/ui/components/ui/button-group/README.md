# ButtonGroup

Conteneur de regroupement de boutons pour composer des barres d'outils cohérentes et ergonomiques.

## Usage

```vue
<script setup lang="ts">
import { ButtonGroup, Button, Icon } from 'my-comp-lib'
</script>

<template>
  <ButtonGroup aria-label="Actions de vue">
    <Button variant="secondary" size="sm">
      <Icon name="expand_less" size="xs" /> Déplier
    </Button>
    <Button variant="secondary" size="sm">
      <Icon name="expand_more" size="xs" /> Replier
    </Button>
  </ButtonGroup>
</template>
```
