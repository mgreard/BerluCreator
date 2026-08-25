<script setup lang="ts">
import { ref } from 'vue'
import Select from './Select.vue'
import { FormGroup } from '@/components/ui/form-group'
import type { SelectProps, SelectOption } from './types'

const selectedLang = ref<string | null>('fr')
const selectedFramework = ref<string | null>(null)
const selectedStatus = ref('')

const languages: SelectOption[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch', disabled: true }
]

const frameworks: SelectOption[] = [
  { value: 'vue', label: 'Vue 3.5' },
  { value: 'react', label: 'React 19' },
  { value: 'svelte', label: 'Svelte 5' },
  { value: 'angular', label: 'Angular 18' }
]

const statuses: SelectOption[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'active', label: 'Actifs' },
  { value: 'archived', label: 'Archivés' }
]

const state = ref<SelectProps>({
  options: languages,
  placeholder: 'Choisir une langue...',
  size: 'md',
  disabled: false,
  error: false,
  contentZIndex: 1300
})
</script>

<template>
  <Story title="Forms/Select" :layout="{ type: 'single' }">
    <Variant title="Standard Select">
      <div
        class="flex flex-col gap-6 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-sm mx-auto"
      >
        <FormGroup label="Langue de l'interface" label-for="language-select" class="mb-0">
          <Select
            id="language-select"
            v-model="selectedLang"
            v-bind="state"
            aria-label="Langue de l'interface"
          />
        </FormGroup>

        <FormGroup label="Framework favori" label-for="framework-select" class="mb-0">
          <Select
            id="framework-select"
            v-model="selectedFramework"
            :options="frameworks"
            placeholder="Sélectionner un framework..."
          />
        </FormGroup>

        <FormGroup label="Filtre de statut" label-for="status-select" class="mb-0">
          <Select id="status-select" v-model="selectedStatus" :options="statuses" />
        </FormGroup>

        <div
          v-if="selectedLang || selectedFramework"
          class="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary"
        >
          Sélections : <span class="font-bold">Langue={{ selectedLang }}</span> |
          <span class="font-bold">Framework={{ selectedFramework }}</span>
        </div>

        <FormGroup
          label="État d'erreur"
          label-for="error-select"
          error="Ce champ est obligatoire."
          class="mb-0"
        >
          <Select id="error-select" :options="languages" error placeholder="Champ obligatoire..." />
        </FormGroup>
      </div>
    </Variant>
  </Story>
</template>
