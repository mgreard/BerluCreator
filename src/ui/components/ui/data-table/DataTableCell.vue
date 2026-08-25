<script setup lang="ts" generic="T = any">
import { ref, computed, watch, nextTick, useTemplateRef } from 'vue'
import { cn } from '@/shared/utils/cn'
import { Badge } from '@/components/ui/badge'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { Select } from '@/components/ui/select'
import type { DataTableCellProps } from './types'

const {
  value,
  item,
  columnKey,
  editable = false,
  editType = 'text',
  options = [],
  formatter = undefined,
  align = 'left',
  maxTextWidth = '200px',
  class: className = undefined
} = defineProps<DataTableCellProps<T>>()

const emit = defineEmits<{
  (e: 'commit', newValue: unknown, previousValue: unknown): void
  (e: 'cancel'): void
  (e: 'start-edit'): void
}>()

// État local isolé pour éliminer les ré-rendus de la table pendant la saisie (Zéro Input Lag)
const isEditing = ref(false)
const localValue = ref<unknown>(value)
const newTagInput = ref('')
let isCancelled = false

// Synchronisation quand la prop value externe change (hors phase d'édition)
watch(
  () => value,
  (newVal) => {
    if (!isEditing.value) {
      localValue.value = newVal
    }
  }
)

// Références typées aux éléments DOM de saisie
const textInputRef = useTemplateRef<HTMLInputElement>('textInput')
const numberInputRef = useTemplateRef<HTMLInputElement>('numberInput')
const tagInputRef = useTemplateRef<HTMLInputElement>('tagInput')

function startEditing() {
  if (!editable || isEditing.value) return
  isCancelled = false
  localValue.value = Array.isArray(value) ? [...value] : value
  newTagInput.value = ''
  isEditing.value = true
  emit('start-edit')

  nextTick(() => {
    if (editType === 'number') {
      numberInputRef.value?.focus()
      numberInputRef.value?.select()
    } else if (editType === 'tags') {
      tagInputRef.value?.focus()
    } else if (editType === 'text') {
      textInputRef.value?.focus()
      textInputRef.value?.select()
    }
  })
}

function handleCommit() {
  if (!isEditing.value) return
  if (isCancelled) {
    isCancelled = false
    return
  }

  isEditing.value = false
  let finalVal: unknown = localValue.value

  if (editType === 'number') {
    finalVal =
      finalVal === '' || finalVal === null || finalVal === undefined ? null : Number(finalVal)
  } else if (editType === 'tags') {
    if (newTagInput.value.trim()) {
      const currentTags = Array.isArray(finalVal) ? [...finalVal] : []
      if (!currentTags.includes(newTagInput.value.trim())) {
        currentTags.push(newTagInput.value.trim())
      }
      finalVal = currentTags
      newTagInput.value = ''
    }
  }

  // Comparaison par valeur ou tableau
  const hasChanged =
    Array.isArray(finalVal) && Array.isArray(value)
      ? finalVal.length !== value.length || finalVal.some((t, i) => t !== value[i])
      : finalVal !== value

  if (hasChanged) {
    emit('commit', finalVal, value)
  }
}

function handleCancel() {
  isCancelled = true
  localValue.value = Array.isArray(value) ? [...value] : value
  newTagInput.value = ''
  isEditing.value = false
  emit('cancel')
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    handleCommit()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    handleCancel()
  }
}

function handleAddTag() {
  const tag = newTagInput.value.trim()
  if (!tag) return
  const currentTags = Array.isArray(localValue.value) ? [...(localValue.value as string[])] : []
  if (!currentTags.includes(tag)) {
    currentTags.push(tag)
    localValue.value = currentTags
  }
  newTagInput.value = ''
}

function handleRemoveTag(tagIndex: number) {
  if (!Array.isArray(localValue.value)) return
  const currentTags = [...(localValue.value as string[])]
  currentTags.splice(tagIndex, 1)
  localValue.value = currentTags
}

function handleBooleanToggle() {
  if (!editable) return
  const toggled = !value
  emit('commit', toggled, value)
}

function updateLocalValue(newVal: unknown) {
  localValue.value = newVal
}

// Formatage des valeurs affichées
const formattedDisplay = computed(() => {
  if (formatter) {
    return formatter(value, item)
  }
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  if (editType === 'select' || editType === 'relation') {
    const found = options.find((opt) => String(opt.value) === String(value))
    if (found) return found.label
  }
  return String(value)
})

// Options normalisées pour Combobox
const comboboxOptions = computed<ComboboxOption[]>(() => {
  return options.map((opt) => ({
    value: opt.value as string | number,
    label: opt.label,
    disabled: opt.disabled,
    description: opt.description
  }))
})

const relationValue = computed<string | number | null>(() => {
  return typeof localValue.value === 'string' || typeof localValue.value === 'number'
    ? localValue.value
    : null
})

const selectValue = computed<string | number | boolean | null>(() => {
  return typeof localValue.value === 'string' ||
    typeof localValue.value === 'number' ||
    typeof localValue.value === 'boolean'
    ? localValue.value
    : null
})

// Tags sous forme de tableau
const displayTags = computed<string[]>(() => {
  if (Array.isArray(value)) {
    return value.map(String)
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
})

const editingTags = computed<string[]>(() => {
  if (Array.isArray(localValue.value)) {
    return localValue.value.map(String)
  }
  return []
})
</script>

<template>
  <div
    :class="
      cn(
        'group/cell relative w-full h-full min-w-0 transition-all duration-150',
        editable && !isEditing && 'hover:bg-primary/5 rounded-lg cursor-pointer',
        isEditing &&
          'ring-2 ring-primary scale-[1.01] bg-bg-surface shadow-glass-sm rounded-lg z-20',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )
    "
    @dblclick="startEditing"
  >
    <!-- MODE 1 : ÉDITION INLINE ISOLÉE (Zéro Input Lag) -->
    <div v-if="isEditing" class="w-full flex items-center gap-1.5 p-0.5">
      <!-- Slot d'éditeur personnalisé -->
      <slot
        name="editor"
        :value="localValue"
        :item="item"
        :column-key="columnKey"
        :commit="handleCommit"
        :cancel="handleCancel"
        :update="updateLocalValue"
      >
        <!-- 1. Éditeur Numérique -->
        <input
          v-if="editType === 'number'"
          ref="numberInput"
          v-model.number="localValue"
          type="number"
          class="w-full px-2.5 py-1 text-xs bg-bg-surface-active border border-primary/50 rounded-lg text-text-primary outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          @keydown="handleKeyDown"
          @blur="handleCommit"
        />

        <!-- 2. Éditeur Tags / Badges -->
        <div
          v-else-if="editType === 'tags'"
          class="flex flex-wrap items-center gap-1 w-full p-1 bg-bg-surface-active/80 border border-primary/40 rounded-lg"
          @keydown.stop="handleKeyDown"
        >
          <span
            v-for="(tag, tIdx) in editingTags"
            :key="`edit-tag-${tIdx}`"
            class="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 bg-primary/20 text-primary rounded border border-primary/30"
          >
            {{ tag }}
            <button
              type="button"
              class="hover:text-danger cursor-pointer leading-none text-xs ml-0.5"
              title="Supprimer"
              @click.stop="handleRemoveTag(tIdx)"
            >
              ×
            </button>
          </span>
          <input
            ref="tagInput"
            v-model="newTagInput"
            type="text"
            placeholder="Ajouter (Entrée)..."
            class="flex-1 min-w-[80px] bg-transparent text-xs text-text-primary outline-none px-1 py-0.5"
            @keydown.enter.prevent="handleAddTag"
            @blur="handleCommit"
          />
        </div>

        <!-- 3. Éditeur Relation / Entity (Combobox Reka UI avec recherche) -->
        <div v-else-if="editType === 'relation'" class="w-full min-w-[140px]">
          <Combobox
            :model-value="relationValue"
            :options="comboboxOptions"
            size="sm"
            placeholder="Sélectionner..."
            @update:model-value="
              (val) => {
                localValue = val
                handleCommit()
              }
            "
          />
        </div>

        <!-- 4. Éditeur Select Standard -->
        <div v-else-if="editType === 'select'" class="w-full min-w-[120px]">
          <Select
            :model-value="selectValue"
            :options="options"
            size="sm"
            placeholder="Choisir..."
            @update:model-value="
              (val) => {
                localValue = val
                handleCommit()
              }
            "
          />
        </div>

        <!-- 5. Éditeur Texte (Standard) -->
        <input
          v-else
          ref="textInput"
          v-model="localValue"
          type="text"
          class="w-full px-2.5 py-1 text-xs bg-bg-surface-active border border-primary/50 rounded-lg text-text-primary outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          @keydown="handleKeyDown"
          @blur="handleCommit"
        />
      </slot>
    </div>

    <!-- MODE 2 : AFFICHAGE LECTURE SEULE / VUE -->
    <div
      v-else
      class="w-full h-full flex items-center min-w-0"
      :class="
        cn(
          align === 'center' && 'justify-center',
          align === 'right' && 'justify-end',
          align === 'left' && 'justify-start'
        )
      "
    >
      <!-- Cas Spécifique 1 : Booléen / Toggle rapide -->
      <template v-if="editType === 'boolean'">
        <button
          type="button"
          :disabled="!editable"
          class="inline-flex items-center gap-1.5 text-xs transition-opacity"
          :class="editable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'"
          @click.stop="handleBooleanToggle"
        >
          <span
            class="w-2.5 h-2.5 rounded-full transition-colors"
            :class="value ? 'bg-success shadow-xs shadow-success/50' : 'bg-text-muted/30'"
          />
          <span class="text-xs text-text-secondary">{{ value ? 'Oui' : 'Non' }}</span>
        </button>
      </template>

      <!-- Cas Spécifique 2 : Tags / Badges en lecture -->
      <template v-else-if="editType === 'tags'">
        <div class="flex flex-wrap items-center gap-1 min-w-0">
          <Badge v-for="(tag, idx) in displayTags" :key="`tag-${idx}`" variant="accent" size="sm">
            {{ tag }}
          </Badge>
          <span v-if="displayTags.length === 0" class="text-xs text-text-muted">-</span>
        </div>
      </template>

      <!-- Slot de cellule personnalisé -->
      <slot
        v-else
        name="cell"
        :value="value"
        :item="item"
        :column-key="columnKey"
        :is-editing="isEditing"
        :start-edit="startEditing"
      >
        <div
          class="truncate block min-w-0 text-xs text-text-primary"
          :style="{ maxWidth: maxTextWidth }"
          :title="String(formattedDisplay)"
        >
          {{ formattedDisplay }}
        </div>
      </slot>

      <!-- Indicateur discret de cellule éditable au survol -->
      <span
        v-if="editable"
        class="opacity-0 group-hover/cell:opacity-40 transition-opacity text-[10px] text-text-muted ml-1 select-none shrink-0"
        title="Double-cliquez pour modifier"
        aria-hidden="true"
      >
        ✎
      </span>
    </div>
  </div>
</template>
