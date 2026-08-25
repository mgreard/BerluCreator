<script setup lang="ts">
import { ref } from 'vue'
import Fieldset from './Fieldset.vue'
import { FormGroup } from '@/components/ui/form-group'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const firstName = ref('')
const lastName = ref('')
</script>

<template>
  <Story title="Forms/Fieldset" :layout="{ type: 'single' }">
    <Variant title="Fieldset Variants & Actions">
      <div
        class="flex flex-col gap-6 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-lg mx-auto"
      >
        <Fieldset
          legend="Identité de l'utilisateur"
          description="Informations requises pour la facturation."
          variant="default"
        >
          <template #actions>
            <Button size="sm" variant="ghost">Réinitialiser</Button>
          </template>

          <FormGroup label="Prénom" label-for="fn-input" required class="mb-0">
            <Input id="fn-input" v-model="firstName" placeholder="Jean" />
          </FormGroup>

          <FormGroup label="Nom" label-for="ln-input" required class="mb-0">
            <Input id="ln-input" v-model="lastName" placeholder="Dupont" />
          </FormGroup>
        </Fieldset>

        <Fieldset
          legend="Section Carte Premium"
          description="Style verre avec ombre et flou."
          variant="card"
        >
          <p class="text-xs text-text-secondary">Contenu groupé dans une carte distincte.</p>
        </Fieldset>
      </div>
    </Variant>
  </Story>
</template>
