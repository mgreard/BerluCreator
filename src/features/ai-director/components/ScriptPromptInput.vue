<script setup lang="ts">
import { Textarea } from '@/components/ui/textarea'
import { FormGroup } from '@/components/ui/form-group'

const scriptModel = defineModel<string>({ default: '' })
</script>

<template>
  <FormGroup
    label="Texte du Script / Dialogue du Présentateur"
    label-for="script-prompt"
    helper-text="Le LLM analysera les émotions, intonations, mots-clés (urgences, accessoires, sourires) pour synchroniser les poses et phonèmes."
    class="mb-0"
  >
    <Textarea
      id="script-prompt"
      v-model="scriptModel"
      :rows="5"
      placeholder="Exemple: Bonjour chers téléspectateurs ! Nous interrompons ce programme pour une information urgente..."
      class="font-sans text-xs resize-none"
    />
  </FormGroup>
</template>
