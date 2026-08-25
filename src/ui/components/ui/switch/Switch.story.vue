<script setup lang="ts">
import { ref } from 'vue'
import Switch from './Switch.vue'
import { Fieldset } from '@/components/ui/fieldset'
import { FormGroup } from '@/components/ui/form-group'
import type { SwitchProps } from './types'

const darkMode = ref(false)
const airplaneMode = ref(false)
const emailNotifications = ref(true)

const state = ref<SwitchProps>({
  size: 'md',
  disabled: false
})
</script>

<template>
  <Story title="Forms/Switch" :layout="{ type: 'single' }">
    <Variant title="Standard & Sizes">
      <div
        class="flex flex-col gap-6 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-md mx-auto"
      >
        <FormGroup label="Activer le mode sombre" label-for="dark-mode-switch" class="mb-0">
          <Switch id="dark-mode-switch" v-model="darkMode" />
        </FormGroup>

        <Fieldset
          legend="Avec Titre & Description"
          variant="ghost"
          class="pt-4 border-t border-border-default mb-0"
        >
          <FormGroup
            label="Mode Avion"
            label-for="airplane-mode-switch"
            helper-text="Désactive toutes les connexions sans fil."
            class="mb-0"
          >
            <Switch
              id="airplane-mode-switch"
              v-model="airplaneMode"
              v-bind="state"
              aria-label="Activer le mode avion"
            />
          </FormGroup>
          <FormGroup
            label="Notifications par Email"
            label-for="email-notifications-switch"
            helper-text="Recevez des résumés d'activités."
            class="mb-0"
          >
            <Switch id="email-notifications-switch" v-model="emailNotifications" />
          </FormGroup>
        </Fieldset>

        <Fieldset
          legend="Tailles disponibles"
          variant="ghost"
          class="pt-4 border-t border-border-default mb-0"
        >
          <FormGroup label="Taille sm (32px)" label-for="small-switch" inline class="mb-0">
            <Switch id="small-switch" size="sm" :model-value="true" />
          </FormGroup>
          <FormGroup label="Taille md (44px)" label-for="medium-switch" inline class="mb-0">
            <Switch id="medium-switch" size="md" :model-value="true" />
          </FormGroup>
          <FormGroup label="Taille lg (56px)" label-for="large-switch" inline class="mb-0">
            <Switch id="large-switch" size="lg" :model-value="true" />
          </FormGroup>
        </Fieldset>
      </div>
    </Variant>
  </Story>
</template>
