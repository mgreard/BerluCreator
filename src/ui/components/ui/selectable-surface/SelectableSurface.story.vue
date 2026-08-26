<script setup lang="ts">
import { ref } from 'vue'
import SelectableSurface from './SelectableSurface.vue'

const selected = ref('sprite-1')
const options = [
  { id: 'sprite-1', label: 'Présentateur' },
  { id: 'sprite-2', label: 'Décor plateau' },
  { id: 'sprite-3', label: 'Accessoire bureau' }
]
</script>

<template>
  <Story title="Primitives/SelectableSurface" :layout="{ type: 'single' }">
    <Variant title="Liste sélectionnable">
      <div role="listbox" aria-label="Sprites" class="grid gap-2 max-w-sm p-4">
        <SelectableSurface
          v-for="option in options"
          :key="option.id"
          :selected="selected === option.id"
          density="compact"
          class="rounded-xl border border-border-default bg-bg-surface px-3 py-2 hover:bg-bg-surface-hover aria-selected:border-primary aria-selected:bg-primary/10"
          @click="selected = option.id"
        >
          {{ option.label }}
        </SelectableSurface>
      </div>
    </Variant>
  </Story>
</template>
