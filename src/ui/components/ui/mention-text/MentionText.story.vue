<script setup lang="ts">
import { ref } from 'vue'
import MentionText from './MentionText.vue'
import MentionChip from './MentionChip.vue'
import type {
  MentionTextProps,
  MentionCategoryDef,
  MentionClickPayload,
  MentionTextSegment
} from './types'

const categories: Record<string, MentionCategoryDef> = {
  character: {
    color: 'purple',
    icon: 'person',
    label: 'Personnage'
  },
  location: {
    color: 'amber',
    icon: 'location_on',
    label: 'Lieu'
  },
  concept: {
    color: 'indigo',
    icon: 'lightbulb',
    label: 'Concept'
  }
}

const state = ref<MentionTextProps>({
  text: 'DJ au @[location:kink|Kink Paradise], amie fidèle de @[character:penny|Penny] et chercheuse sur les @[concept:snowball|Mondes Snowball].',
  categories,
  interactive: true
})

const lastClicked = ref<string>('')

function handleMentionClick(payload: MentionClickPayload) {
  lastClicked.value = `${payload.type} (${payload.id}) : ${payload.label}`
}

function parseExternalFormat(): MentionTextSegment[] {
  return [
    { type: 'text', value: 'Format externe : ' },
    {
      type: 'mention',
      id: 'penny',
      label: 'Penny',
      category: 'character',
      icon: 'person',
      style: { color: '#d8b4fe', borderColor: '#a855f7' }
    }
  ]
}
</script>

<template>
  <Story title="Data Display/MentionText" :layout="{ type: 'single' }">
    <Variant title="Interactive Text with Parsed Mentions">
      <div
        class="flex flex-col gap-6 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-xl mx-auto"
      >
        <MentionText v-bind="state" @mention-click="handleMentionClick" />

        <MentionText
          text="@[Penny](entity:penny)"
          :parser="parseExternalFormat"
          size="sm"
          @mention-click="handleMentionClick"
        />

        <div
          v-if="lastClicked"
          class="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary"
        >
          Dernier clic sur : <span class="font-bold">{{ lastClicked }}</span>
        </div>

        <div class="flex flex-wrap items-center gap-2 pt-4 border-t border-border-default">
          <span class="text-xs text-text-muted">Puces individuelles :</span>
          <MentionChip label="Penny" color="purple" icon="person" />
          <MentionChip label="Neo Tokyo" color="sky" icon="location_on" />
          <MentionChip label="Cyberpunk" color="rose" icon="psychology" />
        </div>
      </div>
    </Variant>
  </Story>
</template>
