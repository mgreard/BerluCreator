<script setup lang="ts">
import { ref } from 'vue'
import MentionInput from './MentionInput.vue'
import { FormGroup } from '@/components/ui/form-group'
import type { MentionTrigger, MentionInputProps } from './types'

interface User {
  id: string
  name: string
  role: string
}

type MentionItem = User | string

const mockUsers: User[] = [
  { id: '1', name: 'Alice Dupont', role: 'Lead Architect' },
  { id: '2', name: 'Bob Martin', role: 'DevOps Senior' },
  { id: '3', name: 'Charlie Durand', role: 'Product Designer' }
]

const userTrigger: MentionTrigger<User> = {
  char: '@',
  search: (q) => mockUsers.filter((u) => u.name.toLowerCase().includes(q.toLowerCase())),
  format: (u) => `@${u.name} `,
  label: (u) => `${u.name} (${u.role})`,
  key: (u) => u.id,
  icon: 'person',
  allowSpaces: true
}

const tagTrigger: MentionTrigger<string> = {
  char: '#',
  search: (q) =>
    ['design', 'refactor', 'bug', 'feature', 'performance'].filter((t) =>
      t.includes(q.toLowerCase())
    ),
  format: (t) => `#${t} `,
  icon: 'tag'
}

const mentionTriggers: MentionTrigger<MentionItem>[] = [userTrigger, tagTrigger]

const textContent = ref('Bonjour @Alice Dupont et bienvenue sur le ticket #refactor !')
const singleLineContent = ref('Ticket assigné à @Bob Martin')

const state = ref<MentionInputProps<MentionItem>>({
  triggers: mentionTriggers,
  multiline: true,
  rows: 4,
  previewBadges: true,
  placeholder: 'Tapez @ pour mentionner un collègue ou # pour un tag...'
})
</script>

<template>
  <Story title="Forms/MentionInput" :layout="{ type: 'single' }">
    <Variant title="Multiline & Single-line Mentions">
      <div
        class="flex flex-col gap-8 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-lg mx-auto"
      >
        <FormGroup
          label="Éditeur Multiligne avec Badges"
          label-for="multiline-mention"
          class="mb-0"
        >
          <MentionInput id="multiline-mention" v-model="textContent" v-bind="state" />
        </FormGroup>

        <FormGroup
          label="Champ Simple Ligne"
          label-for="single-line-mention"
          class="pt-4 border-t border-border-default mb-0"
        >
          <MentionInput
            id="single-line-mention"
            v-model="singleLineContent"
            :triggers="mentionTriggers"
            :multiline="false"
            placeholder="Recherche rapide..."
          />
        </FormGroup>
      </div>
    </Variant>
  </Story>
</template>
