<script setup lang="ts">
import { ref } from 'vue'
import Combobox from './Combobox.vue'
import { FormGroup } from '@/components/ui/form-group'
import type { ComboboxProps, ComboboxOption } from './types'

const selectedCountry = ref<string | number | null>('fr')

const countries: ComboboxOption[] = [
  { value: 'fr', label: 'France', description: 'Europe de l’Ouest' },
  { value: 'de', label: 'Allemagne', description: 'Europe Centrale' },
  { value: 'es', label: 'Espagne', description: 'Europe du Sud' },
  { value: 'it', label: 'Italie', description: 'Europe du Sud' },
  { value: 'jp', label: 'Japon', description: 'Asie de l’Est' },
  { value: 'ca', label: 'Canada', description: 'Amérique du Nord' }
]

const largeCountries: ComboboxOption[] = Array.from({ length: 100 }, (_, i) => ({
  value: `country-${i + 1}`,
  label: `Pays Option #${i + 1}`,
  description: `Zone géographique et fuseau UTC+${(i % 12) + 1}`
}))

const state = ref<ComboboxProps>({
  options: countries,
  placeholder: 'Choisir un pays...',
  searchPlaceholder: 'Rechercher un pays...',
  size: 'md',
  disabled: false,
  error: false
})
</script>

<template>
  <Story title="Forms/Combobox" :layout="{ type: 'single' }">
    <Variant title="Standard & Virtualized Combobox">
      <div
        class="flex flex-col gap-6 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-sm mx-auto"
      >
        <FormGroup label="Combobox Standard" label-for="country-combobox" class="mb-0">
          <Combobox id="country-combobox" v-model="selectedCountry" v-bind="state" />
        </FormGroup>

        <div
          v-if="selectedCountry"
          class="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary"
        >
          Valeur sélectionnée : <span class="font-bold">{{ selectedCountry }}</span>
        </div>

        <FormGroup
          label="Combobox Virtualisé (100 options)"
          label-for="large-country-combobox"
          class="pt-4 border-t border-border-default mb-0"
        >
          <Combobox
            id="large-country-combobox"
            :options="largeCountries"
            placeholder="Sélectionner dans 100 items..."
            :virtual-threshold="15"
          />
        </FormGroup>
      </div>
    </Variant>
  </Story>
</template>
