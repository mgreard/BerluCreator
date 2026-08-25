<script setup lang="ts">
import { ref } from 'vue'
import Input from './Input.vue'
import { Icon } from '@/components/ui/icon'
import { FormGroup } from '@/components/ui/form-group'
import type { InputProps } from './types'

const textValue = ref('')
const emailValue = ref('')
const numberValue = ref(42)

const state = ref<InputProps>({
  placeholder: 'Tapez votre texte...',
  size: 'md',
  disabled: false,
  readonly: false,
  error: false
})
</script>

<template>
  <Story title="Forms/Input" :layout="{ type: 'single' }">
    <Variant title="Standard Input">
      <div
        class="flex flex-col gap-6 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-md mx-auto"
      >
        <FormGroup label="Texte Standard" label-for="standard-input" class="mb-0">
          <Input id="standard-input" v-model="textValue" v-bind="state" />
        </FormGroup>

        <FormGroup label="Avec Préfixe & Suffixe" label-for="email-input-story" class="mb-0">
          <Input
            id="email-input-story"
            v-model="emailValue"
            placeholder="nom@exemple.com"
            type="email"
            autocomplete="email"
            aria-label="Adresse email"
          >
            <template #prefix>
              <Icon name="mail" size="xs" />
            </template>
            <template #suffix>
              <Icon name="check" size="xs" class="text-success" />
            </template>
          </Input>
        </FormGroup>

        <FormGroup label="Nombre (Number)" label-for="number-input-story" class="mb-0">
          <Input id="number-input-story" v-model="numberValue" type="number" />
        </FormGroup>

        <FormGroup
          label="État d'erreur"
          label-for="error-input-story"
          error="La valeur saisie est invalide."
          class="mb-0"
        >
          <Input
            id="error-input-story"
            model-value="Valeur invalide"
            error
            placeholder="Erreur..."
          />
        </FormGroup>
      </div>
    </Variant>
  </Story>
</template>
