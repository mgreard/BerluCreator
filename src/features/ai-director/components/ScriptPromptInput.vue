<script setup lang="ts">
import { Textarea } from '@/components/ui/textarea'

const scriptModel = defineModel<string>({ default: '' })
</script>

<template>
  <div class="flex flex-col gap-2">
    <label class="text-xs font-semibold text-foreground flex items-center gap-1.5">
      <span>Texte du Script / Dialogue du Présentateur :</span>
    </label>
    <Textarea
      v-model="scriptModel"
      :rows="5"
      placeholder="Exemple: Bonjour chers téléspectateurs ! Nous interrompons ce programme pour une information urgente..."
      class="font-sans text-xs resize-none"
    />
    <p class="text-[11px] text-muted-foreground">
      Le LLM analysera les émotions, intonations, mots-clés (urgences, accessoires, sourires) pour synchroniser les poses et phonèmes.
    </p>
  </div>
</template>
