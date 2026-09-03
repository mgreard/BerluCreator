<script setup lang="ts">
import { ref } from 'vue'
import SearchInput from './SearchInput.vue'
import { FormGroup } from '@/components/ui/form-group'
import type { SearchInputProps } from './types'

const query = ref('')
const state = ref<SearchInputProps>({
  placeholder: 'Rechercher un composant ou un guide...',
  size: 'md',
  disabled: false,
  clearable: true
})
</script>

<template>
  <Story title="Forms/SearchInput" :layout="{ type: 'single' }">
    <Variant title="Interactive Search Input">
      <div
        class="flex flex-col gap-6 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-md mx-auto"
      >
        <FormGroup label="Barre de Recherche" class="mb-0">
          <SearchInput v-model="query" v-bind="state" />
        </FormGroup>

        <div
          v-if="query"
          class="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary"
        >
          Requête active : <span class="font-bold">{{ query }}</span>
        </div>

        <fieldset class="pt-4 border-t border-border-default mb-0 flex flex-col gap-3">
          <legend class="text-xs font-semibold text-text-primary mb-2">Tailles disponibles</legend>
          <div class="flex flex-col gap-3">
            <SearchInput placeholder="Taille sm (32px)" size="sm" />
            <SearchInput placeholder="Taille md (40px)" size="md" />
            <SearchInput placeholder="Taille lg (48px)" size="lg" />
          </div>
        </fieldset>
      </div>
    </Variant>
  </Story>
</template>
