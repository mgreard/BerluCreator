<script setup lang="ts">
import { ref } from 'vue'
import Textarea from './Textarea.vue'
import { FormGroup } from '@/components/ui/form-group'
import type { TextareaProps } from './types'

const standardContent = ref('Une description détaillée avec plusieurs paragraphes.')
const codeContent = ref('{\n  "name": "my-library",\n  "version": "1.0.0"\n}')

const state = ref<TextareaProps>({
  placeholder: 'Écrivez votre message ici...',
  rows: 4,
  size: 'md',
  disabled: false,
  readonly: false,
  error: false
})
</script>

<template>
  <Story title="Forms/Textarea" :layout="{ type: 'single' }">
    <Variant title="Standard Textarea">
      <div
        class="flex flex-col gap-6 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-lg mx-auto"
      >
        <FormGroup label="Zone de texte standard" label-for="standard-textarea" class="mb-0">
          <Textarea
            id="standard-textarea"
            v-model="standardContent"
            v-bind="state"
            aria-label="Zone de texte standard"
            spellcheck="true"
          />
        </FormGroup>

        <FormGroup label="Mode Monospace (Code / JSON)" label-for="code-textarea" class="mb-0">
          <Textarea id="code-textarea" v-model="codeContent" monospace :rows="5" />
        </FormGroup>

        <FormGroup
          label="État d'erreur"
          label-for="error-textarea"
          error="Le contenu doit être corrigé."
          class="mb-0"
        >
          <Textarea id="error-textarea" model-value="Contenu avec avertissement" error :rows="3" />
        </FormGroup>
      </div>
    </Variant>
  </Story>
</template>
