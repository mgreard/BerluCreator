<script setup lang="ts">
import { ref } from 'vue'
import RadioGroup from './RadioGroup.vue'
import { Fieldset } from '@/components/ui/fieldset'
import type { RadioGroupProps, RadioOption } from './types'

const plan = ref<string | number | boolean | null>('pro')
const alignment = ref<string | number | boolean | null>('center')

const planOptions: RadioOption[] = [
  { value: 'starter', label: 'Starter', description: 'Idéal pour démarrer (Gratuit)' },
  { value: 'pro', label: 'Pro', description: 'Pour les équipes actives (29€/mois)' },
  {
    value: 'enterprise',
    label: 'Enterprise',
    description: 'Support dédié & SLA sur mesure',
    disabled: true
  }
]

const alignmentOptions: RadioOption[] = [
  { value: 'left', label: 'Gauche' },
  { value: 'center', label: 'Centre' },
  { value: 'right', label: 'Droite' }
]

const state = ref<RadioGroupProps>({
  options: planOptions,
  variant: 'list',
  size: 'md',
  disabled: false
})
</script>

<template>
  <Story title="Forms/RadioGroup" :layout="{ type: 'single' }">
    <Variant title="Pills, Segmented & List Variants">
      <div
        class="flex flex-col gap-8 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-md mx-auto"
      >
        <Fieldset legend="Variante Segmented (Contrôle Compact)" variant="ghost" class="mb-0">
          <RadioGroup v-model="alignment" :options="alignmentOptions" variant="segmented" />
        </Fieldset>

        <Fieldset legend="Variante Pills (Badges Sélectables)" variant="ghost" class="mb-0">
          <RadioGroup v-model="alignment" :options="alignmentOptions" variant="pills" />
        </Fieldset>

        <Fieldset
          legend="Variante List (Cartes d'Offres avec Description)"
          variant="ghost"
          class="mb-0"
        >
          <RadioGroup v-model="plan" v-bind="state" />
        </Fieldset>

        <div class="text-xs text-primary font-bold">Plan sélectionné : {{ plan }}</div>
      </div>
    </Variant>
  </Story>
</template>
