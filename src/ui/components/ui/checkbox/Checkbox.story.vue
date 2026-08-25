<script setup lang="ts">
import { ref } from 'vue'
import Checkbox from './Checkbox.vue'
import { Fieldset } from '@/components/ui/fieldset'
import { FormGroup } from '@/components/ui/form-group'
import type { CheckboxProps } from './types'

const termsAccepted = ref(false)
const selectedFeatures = ref<string[]>(['push'])
const isIndeterminate = ref(true)

const state = ref<CheckboxProps>({
  label: 'Accepter les conditions d’utilisation',
  description: 'Vous devez lire et accepter notre politique de confidentialité.',
  size: 'md',
  disabled: false,
  error: false
})
</script>

<template>
  <Story title="Forms/Checkbox" :layout="{ type: 'single' }">
    <Variant title="Single & Multiple Checkboxes">
      <div
        class="flex flex-col gap-6 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-md mx-auto"
      >
        <FormGroup label="Case Unique (Booléen)" label-for="terms-checkbox" class="mb-0">
          <Checkbox id="terms-checkbox" v-model="termsAccepted" v-bind="state" />
        </FormGroup>

        <Fieldset
          legend="Sélection Multiple (Array)"
          variant="ghost"
          class="pt-4 border-t border-border-default mb-0"
        >
          <div class="flex flex-col gap-2">
            <Checkbox
              v-model="selectedFeatures"
              value="push"
              label="Notifications Push"
              description="Alertes en temps réel sur votre mobile."
            />
            <Checkbox
              v-model="selectedFeatures"
              value="email"
              label="Newsletter Hebdomadaire"
              description="Résumé des nouveautés chaque lundi."
            />
            <Checkbox
              v-model="selectedFeatures"
              value="sms"
              label="Alertes SMS"
              description="Messages d'urgence uniquement."
            />
          </div>
          <div class="text-xs text-primary font-bold">
            Options sélectionnées : {{ selectedFeatures }}
          </div>
        </Fieldset>

        <FormGroup
          label="État Indéterminé"
          label-for="indeterminate-checkbox"
          class="pt-4 border-t border-border-default mb-0"
        >
          <Checkbox
            id="indeterminate-checkbox"
            :indeterminate="isIndeterminate"
            label="Sélectionner tous les éléments"
            description="État partiellement coché"
            @change="isIndeterminate = false"
          />
        </FormGroup>
      </div>
    </Variant>
  </Story>
</template>
