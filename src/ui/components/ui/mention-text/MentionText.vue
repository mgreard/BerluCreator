<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/shared/utils/cn'
import MentionChip from './MentionChip.vue'
import type { MentionTextProps, MentionTextEmits, MentionTextSegment } from './types'

const {
  variant = 'text',
  text = '',
  categories = {},
  as = 'p',
  interactive = true,
  parser = undefined,
  size = 'md',
  highlightQuery = '',
  class: className = undefined
} = defineProps<MentionTextProps>()

const emit = defineEmits<MentionTextEmits>()

function parseDefaultMentions(content: string): MentionTextSegment[] {
  const segments: MentionTextSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  const mentionTokenRegex = /@\[([a-zA-Z0-9_-]+):([^|\]]+)\|([^\]]+)\]/g

  while ((match = mentionTokenRegex.exec(content)) !== null) {
    const [fullMatch, type, id, label] = match
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: content.substring(lastIndex, match.index) })
    }

    const category = categories[type]
    segments.push({
      type: 'mention',
      id,
      label,
      category: type,
      color: category?.color || 'neutral',
      icon: category?.icon
    })
    lastIndex = match.index + fullMatch.length
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'text', value: content.substring(lastIndex) })
  }

  return segments
}

const segments = computed(() => {
  const content = text || ''
  return parser ? parser(content) : parseDefaultMentions(content)
})

function splitTextForHighlight(
  textVal: string,
  query: string
): Array<{ text: string; isMatch: boolean }> {
  const q = query.trim()
  if (!q) return [{ text: textVal, isMatch: false }]
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = textVal.split(regex)
  return parts
    .filter((p) => p.length > 0)
    .map((p) => ({ text: p, isMatch: p.toLowerCase() === q.toLowerCase() }))
}

function handleMentionClick(
  segment: Extract<MentionTextSegment, { type: 'mention' }>,
  event: MouseEvent
) {
  emit('mention-click', {
    id: String(segment.id),
    type: segment.category || '',
    label: segment.label,
    event
  })
}
</script>

<template>
  <component :is="as" :class="cn('text-sm leading-relaxed text-text-secondary', className)">
    <template v-for="(segment, index) in segments" :key="`${segment.type}-${index}`">
      <template v-if="segment.type === 'text'">
        <template v-if="highlightQuery">
          <template
            v-for="(part, pIdx) in splitTextForHighlight(segment.value, highlightQuery)"
            :key="pIdx"
          >
            <mark
              v-if="part.isMatch"
              class="bg-amber-500/35 text-amber-200 font-bold px-1 py-0.5 rounded border-b-2 border-amber-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]"
              >{{ part.text }}</mark
            >
            <template v-else>{{ part.text }}</template>
          </template>
        </template>
        <template v-else>{{ segment.value }}</template>
      </template>
      <MentionChip
        v-else
        :id="segment.id"
        :variant="segment.variant || variant"
        :label="segment.label"
        :category="segment.category"
        :color="segment.color"
        :icon="segment.icon"
        :size="size"
        :interactive="interactive"
        :style="segment.style"
        @click="handleMentionClick(segment, $event.event)"
      />
    </template>
  </component>
</template>
