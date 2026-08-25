<script setup lang="ts" generic="T = any">
import { computed, useId, useTemplateRef, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { cn } from '@/shared/utils/cn'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import type { MentionTrigger, Token, MentionInputProps, MentionInputEmits } from './types'
import { useMentionInput } from './useMentionInput'
import { mentionContainerVariants } from './variants'

const model = defineModel<string>({ default: '' })

const {
  triggers = [],
  multiline = true,
  rows = 3,
  placeholder = 'Tapez @ pour mentionner...',
  previewBadges = false,
  showTriggerButtons = true,
  badgeParser = undefined,
  disabled = false,
  readonly = false,
  error = false,
  id = undefined,
  name = undefined,
  class: className = undefined
} = defineProps<MentionInputProps<T>>()

const emit = defineEmits<MentionInputEmits<T>>()

const autoId = useId()
const inputId = computed(() => id || autoId)
const suggestionsId = computed(() => `${inputId.value}-suggestions`)
const hasError = computed(() => Boolean(error))

const editorRef = useTemplateRef<HTMLTextAreaElement | HTMLInputElement>('editorRef')
const popoverRef = useTemplateRef<HTMLDivElement>('popoverRef')
const containerRef = useTemplateRef<HTMLDivElement>('containerRef')

const {
  isOpen,
  isLoading,
  items,
  activeIndex,
  activeTrigger,
  query,
  caretPosition,
  checkTrigger,
  handleKeyDown,
  selectItem,
  openWithTrigger,
  close
} = useMentionInput<T>({
  triggers: computed(() => triggers),
  editorRef,
  onSelect: (item, trigger) => {
    emit('select', item, trigger)
  }
})

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Parseur de badges par défaut si non fourni
const defaultBadgeParser = (text: string): Token[] => {
  if (!text) return []
  const tokens: Token[] = []
  const currentTriggers = triggers

  // Match des patterns avec échappement de métacaractères et prévention ReDoS
  for (const trigger of currentTriggers) {
    if (!trigger.char) continue
    const escapedChar = escapeRegExp(trigger.char)
    const regex = new RegExp(`(?<=^|\\s)${escapedChar}([\\w.-]+)`, 'g')
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      tokens.push({
        id: match[1],
        label: `${trigger.char}${match[1]}`,
        type: trigger.char,
        raw: match[0]
      })
      if (match.index === regex.lastIndex) {
        regex.lastIndex++
      }
    }
  }
  return tokens
}

const parsedBadges = computed(() => {
  if (!previewBadges) return []
  const parser = badgeParser || defaultBadgeParser
  return parser(model.value || '')
})

function removeBadge(token: Token) {
  const el = editorRef.value
  if (!el) {
    model.value = (model.value || '').replace(token.raw, '').trim()
    return
  }

  const currentVal = el.value || ''
  const index = currentVal.indexOf(token.raw)
  if (index !== -1) {
    el.focus()
    el.setRangeText('', index, index + token.raw.length, 'select')
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  model.value = target.value
  checkTrigger()
}

function handleEditorClick() {
  checkTrigger()
}

function handleEditorKeyUp(e: KeyboardEvent) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter' && e.key !== 'Escape') {
    checkTrigger()
  }
}

// Calcul de position absolue du menu de suggestions dans le conteneur
const popoverStyles = computed(() => {
  const left = Math.min(caretPosition.value.left, 240)
  const top = caretPosition.value.top + caretPosition.value.height + 6
  return {
    top: `${top}px`,
    left: `${Math.max(12, left)}px`
  }
})

// Fermeture au clic à l'extérieur
function handleDocumentClick(e: MouseEvent) {
  if (!isOpen.value) return
  const target = e.target as Node
  if (
    containerRef.value &&
    !containerRef.value.contains(target) &&
    popoverRef.value &&
    !popoverRef.value.contains(target)
  ) {
    close()
  }
}

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('click', handleDocumentClick)
  }
})

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', handleDocumentClick)
  }
})

// Défilement automatique de l'élément actif dans la liste de suggestions
watch(activeIndex, (newIdx) => {
  nextTick(() => {
    if (!popoverRef.value) return
    const activeEl = popoverRef.value.querySelector(
      `[data-index="${newIdx}"]`
    ) as HTMLElement | null
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  })
})

function getItemLabel(item: T, trigger: MentionTrigger<T>): string {
  if (trigger.label) return trigger.label(item)
  if (typeof item === 'string') return item
  if (typeof item === 'object' && item !== null) {
    const record = item as Record<string, unknown>
    return String(record.label || record.name || record.id || JSON.stringify(item))
  }
  return String(item)
}

function getItemKey(item: T, trigger: MentionTrigger<T>, index: number): string | number {
  if (trigger.key) return trigger.key(item)
  if (typeof item === 'object' && item !== null) {
    const record = item as Record<string, unknown>
    if (record.id !== undefined) return record.id as string | number
  }
  return index
}
</script>

<template>
  <div
    ref="containerRef"
    :class="cn(mentionContainerVariants({ hasError, disabled }), isOpen && 'z-50', className)"
  >
    <!-- Barre de prévisualisation des badges (Container-Responsive) -->
    <div
      v-if="previewBadges && parsedBadges.length > 0"
      class="flex flex-wrap items-center gap-1.5 p-2 pb-0 @[400px]:gap-2 border-b border-border-default/40"
    >
      <slot
        v-for="token in parsedBadges"
        :key="token.raw"
        name="badge"
        :token="token"
        :remove="() => removeBadge(token)"
      >
        <Badge variant="neutral" size="sm" class="inline-flex items-center gap-1 pl-2 pr-1 py-0.5">
          <span class="text-primary font-medium">{{ token.label }}</span>
          <button
            type="button"
            class="text-text-muted hover:text-danger p-0.5 rounded-full hover:bg-bg-surface-hover cursor-pointer"
            aria-label="Supprimer le jeton"
            @click.stop="removeBadge(token)"
          >
            <Icon name="close" size="xs" />
          </button>
        </Badge>
      </slot>
    </div>

    <!-- Zone principale d'édition de texte -->
    <div class="relative flex items-start w-full min-w-0">
      <!-- Slot Prefix -->
      <span
        v-if="$slots.prefix"
        class="flex items-center justify-center text-text-muted pl-3 pt-2.5 select-none shrink-0"
        aria-hidden="true"
      >
        <slot name="prefix" />
      </span>

      <!-- Editeur Multiligne (Textarea) -->
      <textarea
        v-if="multiline"
        :id="inputId"
        ref="editorRef"
        :name="name"
        :value="model"
        :rows="rows"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :aria-invalid="hasError ? 'true' : undefined"
        role="combobox"
        aria-haspopup="listbox"
        aria-autocomplete="list"
        :aria-controls="isOpen ? suggestionsId : undefined"
        :aria-expanded="isOpen"
        class="flex-1 w-full min-w-0 bg-transparent border-none outline-none appearance-none ring-0 shadow-none text-inherit font-sans text-sm p-3 resize-y placeholder:text-text-muted disabled:cursor-not-allowed"
        style="
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          background: transparent !important;
        "
        @input="handleInput"
        @keydown="handleKeyDown"
        @click="handleEditorClick"
        @keyup="handleEditorKeyUp"
        @focus="emit('focus', $event)"
        @blur="emit('blur', $event)"
      />

      <!-- Editeur Ligne Simple (Input) -->
      <input
        v-else
        :id="inputId"
        ref="editorRef"
        :name="name"
        :type="'text'"
        :value="model"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :aria-invalid="hasError ? 'true' : undefined"
        role="combobox"
        aria-haspopup="listbox"
        aria-autocomplete="list"
        :aria-controls="isOpen ? suggestionsId : undefined"
        :aria-expanded="isOpen"
        class="flex-1 w-full min-w-0 bg-transparent border-none outline-none appearance-none ring-0 shadow-none text-inherit font-sans text-sm py-2 px-3 placeholder:text-text-muted disabled:cursor-not-allowed"
        style="
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          background: transparent !important;
        "
        @input="handleInput"
        @keydown="handleKeyDown"
        @click="handleEditorClick"
        @keyup="handleEditorKeyUp"
        @focus="emit('focus', $event)"
        @blur="emit('blur', $event)"
      />

      <!-- Slot Suffix -->
      <span
        v-if="$slots.suffix"
        class="flex items-center justify-center text-text-muted pr-3 pt-2.5 select-none shrink-0"
        aria-hidden="true"
      >
        <slot name="suffix" />
      </span>
    </div>

    <!-- Barre d'action inférieure / Boutons de déclenchement rapide -->
    <div
      v-if="showTriggerButtons && triggers.length > 0 && !disabled && !readonly"
      class="flex items-center justify-between px-3 py-1.5 bg-bg-surface/30 border-t border-border-default/40 text-xs text-text-muted"
    >
      <div class="flex items-center gap-1.5 flex-wrap">
        <span class="text-[11px] font-medium text-text-muted/70 mr-1">Raccourcis :</span>
        <template v-for="trig in triggers" :key="trig.char">
          <slot name="trigger-button" :trigger="trig" :open="() => openWithTrigger(trig)">
            <button
              type="button"
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-bg-surface border border-border-default/80 hover:border-primary/50 hover:text-text-primary text-text-secondary transition-colors cursor-pointer text-[11px] font-mono"
              :title="`Insérer ${trig.char}`"
              @click="openWithTrigger(trig)"
            >
              <Icon v-if="trig.icon" :name="trig.icon" size="xs" />
              <span>{{ trig.char }}</span>
            </button>
          </slot>
        </template>
      </div>

      <div class="text-[11px] text-text-muted/60">
        {{ multiline ? 'Ctrl+Enter pour valider' : '' }}
      </div>
    </div>

    <!-- Popover Flottant des Suggestions (Mirror DOM Anchored) -->
    <div
      v-if="isOpen && activeTrigger"
      :id="suggestionsId"
      ref="popoverRef"
      :style="popoverStyles"
      role="listbox"
      :aria-label="`Suggestions pour ${activeTrigger.char}`"
      class="absolute z-50 min-w-[200px] max-w-[320px] max-h-60 overflow-y-auto rounded-[var(--radius-md,12px)] border border-border-default bg-bg-elevated shadow-glass-lg text-text-primary outline-none select-none animate-in fade-in-0 zoom-in-95 duration-300 ease-out p-1"
      data-surface="solid"
    >
      <!-- Slot Header du Popover -->
      <slot name="header" :trigger="activeTrigger.char" :count="items.length">
        <div
          class="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold text-text-muted border-b border-border-default/50 mb-1"
        >
          <div class="flex items-center gap-1">
            <Icon
              v-if="activeTrigger.icon"
              :name="activeTrigger.icon"
              size="xs"
              class="text-primary"
            />
            <span>Mention {{ activeTrigger.char }}</span>
          </div>
          <span
            class="text-[10px] bg-bg-surface px-1.5 py-0.2 rounded-full border border-border-default"
          >
            {{ items.length }}
          </span>
        </div>
      </slot>

      <!-- État Chargement Asynchrone -->
      <div v-if="isLoading" class="p-3 text-center text-xs text-text-muted">
        <slot name="loading" :trigger="activeTrigger.char">
          <div class="flex items-center justify-center gap-2">
            <span
              class="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"
            />
            <span>Recherche en cours...</span>
          </div>
        </slot>
      </div>

      <!-- Liste des Items -->
      <template v-else-if="items.length > 0">
        <div
          v-for="(item, idx) in items"
          :key="getItemKey(item, activeTrigger, idx)"
          :data-index="idx"
          role="option"
          :aria-selected="idx === activeIndex"
          class="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          :class="
            idx === activeIndex
              ? 'bg-primary/20 text-primary font-semibold shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover/80'
          "
          @mousedown.prevent="selectItem(item)"
        >
          <slot
            name="item"
            :item="item"
            :trigger="activeTrigger.char"
            :active="idx === activeIndex"
            :select="() => selectItem(item)"
          >
            <Icon name="alternate_email" size="xs" class="opacity-60" />
            <span class="truncate">{{ getItemLabel(item, activeTrigger) }}</span>
          </slot>
        </div>
      </template>

      <!-- État Vide / Aucun résultat -->
      <div v-else class="p-3 text-center text-xs text-text-muted">
        <slot name="empty" :query="query" :trigger="activeTrigger.char">
          <span>Aucun résultat pour "{{ query }}"</span>
        </slot>
      </div>
    </div>
  </div>
</template>
