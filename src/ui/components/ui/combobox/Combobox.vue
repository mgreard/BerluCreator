<script setup lang="ts">
import {
  ref,
  computed,
  shallowRef,
  watch,
  useTemplateRef,
  nextTick,
  type ComponentPublicInstance
} from 'vue'
import {
  ComboboxRoot,
  ComboboxAnchor,
  ComboboxPortal,
  ComboboxContent,
  ComboboxViewport,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxEmpty,
  type AcceptableValue
} from 'reka-ui'
import { useVirtualGrid } from '@/shared/composables/useVirtualGrid'
import { cn } from '@/shared/utils/cn'
import { Icon } from '@/components/ui/icon'
import type { ComboboxProps, ComboboxEmits, ComboboxOption } from './types'
import { comboboxTriggerVariants } from './variants'

const model = defineModel<string | number | null>()
const searchTerm = ref('')
const isOpen = ref(false)
const highlightedIndex = ref(0)
const searchInputRef = useTemplateRef<HTMLInputElement>('searchInput')
const viewportRef = shallowRef<HTMLElement | null>(null)

function setViewportRef(value: Element | ComponentPublicInstance | null) {
  if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) {
    viewportRef.value = value
    return
  }

  viewportRef.value = value && '$el' in value && value.$el instanceof HTMLElement ? value.$el : null
}

const {
  options = [],
  placeholder = 'Sélectionner une option...',
  searchPlaceholder = 'Rechercher...',
  size = 'md',
  disabled = false,
  id = undefined,
  name = undefined,
  error = false,
  virtualThreshold = 15,
  class: className = undefined
} = defineProps<ComboboxProps>()

const emit = defineEmits<ComboboxEmits>()

// Utilisation de shallowRef pour stocker les options brutes
const rawOptions = shallowRef<ComboboxOption[]>([])
watch(
  () => options,
  (newOpts) => {
    rawOptions.value = newOpts
  },
  { immediate: true }
)

// Filtrage réactif performant
const filteredOptions = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()
  if (!query) return rawOptions.value
  return rawOptions.value.filter(
    (opt) =>
      opt.label.toLowerCase().includes(query) ||
      (opt.description && opt.description.toLowerCase().includes(query))
  )
})

// Détection de la virtualisation pour les grandes listes
const isVirtualized = computed(() => filteredOptions.value.length > virtualThreshold)

// Virtualisation avec useVirtualGrid
const { visibleItems, totalHeight, offsetY, updateMetrics } = useVirtualGrid(filteredOptions, {
  itemHeight: 40,
  columns: 1,
  overscan: 4,
  containerRef: viewportRef
})

// Recalcul des métriques de virtualisation et focus à l'ouverture
watch(isOpen, async (open) => {
  if (open) {
    searchTerm.value = ''
    highlightedIndex.value = 0
    await nextTick()
    searchInputRef.value?.focus()
    updateMetrics()
  }
})

const selectedOption = computed(() => {
  return rawOptions.value.find((opt) => String(opt.value) === String(model.value))
})

function selectOption(opt: ComboboxOption) {
  if (opt.disabled) return
  model.value = opt.value
  emit('change', opt.value)
  isOpen.value = false
}

function handleValueUpdate(val: AcceptableValue) {
  if (val === null || val === undefined) {
    model.value = null
    emit('change', null)
    return
  }
  const match = rawOptions.value.find((o) => String(o.value) === String(val))
  const actualVal = match ? match.value : (val as string | number)
  model.value = actualVal
  emit('change', actualVal)
}

function handleSearchInput(e: Event) {
  const target = e.target as HTMLInputElement
  searchTerm.value = target.value
  highlightedIndex.value = 0
  emit('search', target.value)
}

function clearSelection(e: Event) {
  e.stopPropagation()
  e.preventDefault()
  model.value = null
  emit('change', null)
}

function handleKeyDown(e: KeyboardEvent) {
  const total = filteredOptions.value.length
  if (total === 0) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlightedIndex.value = (highlightedIndex.value + 1) % total
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightedIndex.value = (highlightedIndex.value - 1 + total) % total
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const target = filteredOptions.value[highlightedIndex.value]
    if (target) {
      selectOption(target)
    }
  } else if (e.key === 'Escape') {
    isOpen.value = false
  }
}

function toggleDropdown() {
  if (disabled) return
  isOpen.value = !isOpen.value
}
</script>

<template>
  <ComboboxRoot
    v-model:open="isOpen"
    :model-value="model !== null && model !== undefined ? String(model) : undefined"
    :disabled="disabled"
    :name="name"
    @update:model-value="handleValueUpdate"
  >
    <!-- Champ caché pour formulaire standard -->
    <input v-if="name" type="hidden" :name="name" :value="model ?? ''" />

    <ComboboxAnchor as-child>
      <div
        :id="id"
        :class="
          cn(
            comboboxTriggerVariants({ size, error: Boolean(error), disabled }),
            'cursor-pointer',
            className
          )
        "
        role="combobox"
        :aria-label="selectedOption?.label ?? placeholder"
        :aria-expanded="isOpen"
        :aria-disabled="disabled"
        tabindex="0"
        @click="toggleDropdown"
        @keydown.enter.prevent="toggleDropdown"
        @keydown.space.prevent="toggleDropdown"
      >
        <span v-if="selectedOption" class="truncate font-medium text-text-primary text-left flex-1">
          {{ selectedOption.label }}
        </span>
        <span v-else class="truncate text-text-muted text-left flex-1">
          {{ placeholder }}
        </span>

        <div class="flex items-center gap-1.5 ml-2 shrink-0">
          <button
            v-if="model !== null && model !== undefined && !disabled"
            type="button"
            class="inline-flex size-[18px] shrink-0 items-center justify-center p-0 leading-none text-text-muted hover:text-text-primary rounded transition-colors cursor-pointer"
            title="Effacer"
            aria-label="Effacer la sélection"
            @click.stop="clearSelection"
          >
            <Icon name="close" size="xs" />
          </button>
          <button
            type="button"
            class="inline-flex size-[18px] shrink-0 items-center justify-center p-0 leading-none text-text-muted transition-transform duration-150 cursor-pointer"
            :class="isOpen ? 'rotate-180' : ''"
            aria-label="Ouvrir la liste"
            tabindex="-1"
            @click.stop="toggleDropdown"
          >
            <Icon name="expand_more" size="xs" aria-hidden="true" />
          </button>
        </div>
      </div>
    </ComboboxAnchor>

    <ComboboxPortal>
      <ComboboxContent
        class="z-50 min-w-[12rem] w-[var(--reka-combobox-trigger-width)] max-h-72 overflow-hidden rounded-[var(--radius-md,12px)] border border-border-default bg-bg-elevated shadow-glass-lg text-text-primary animate-in fade-in-80 duration-300 ease-out select-none outline-none"
        data-surface="solid"
        position="popper"
        :side-offset="4"
        align="start"
        @keydown="handleKeyDown"
      >
        <!-- Champ de recherche textuelle fluide -->
        <div class="p-2 border-b border-border-default bg-bg-elevated">
          <div class="relative flex items-center">
            <Icon
              name="search"
              size="xs"
              class="absolute left-2.5 text-text-muted pointer-events-none"
              aria-hidden="true"
            />
            <input
              ref="searchInput"
              v-model="searchTerm"
              type="text"
              :placeholder="searchPlaceholder"
              class="w-full bg-bg-surface border border-border-default rounded-lg pl-7 pr-7 py-1.5 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              autocomplete="off"
              spellcheck="false"
              @input="handleSearchInput"
            />
            <button
              v-if="searchTerm"
              type="button"
              class="absolute right-2 text-xs text-text-muted hover:text-text-primary p-0.5 rounded cursor-pointer flex items-center justify-center"
              aria-label="Effacer la recherche"
              @click="searchTerm = ''"
            >
              <Icon name="close" size="xs" />
            </button>
          </div>
        </div>

        <!-- Zone de liste des options -->
        <ComboboxViewport
          :ref="setViewportRef"
          class="overflow-y-auto max-h-56 p-1.5 focus:outline-none custom-scrollbar"
        >
          <!-- Cas 1 : Rendu virtualisé (>= 15 options) -->
          <div
            v-if="isVirtualized && filteredOptions.length > 0"
            :style="{ height: `${totalHeight}px`, position: 'relative' }"
          >
            <div
              :style="{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${offsetY}px)`
              }"
            >
              <ComboboxItem
                v-for="vItem in visibleItems"
                :key="String(vItem.item.value)"
                :value="String(vItem.item.value)"
                :disabled="vItem.item.disabled"
                :class="
                  cn(
                    'relative flex items-center justify-between w-full h-[40px] px-3 rounded-lg text-sm select-none cursor-pointer outline-none transition-colors text-text-primary',
                    String(vItem.item.value) === String(model)
                      ? 'bg-primary/15 font-semibold text-primary'
                      : 'hover:bg-bg-surface-hover',
                    filteredOptions[highlightedIndex]?.value === vItem.item.value &&
                      'bg-bg-surface-hover',
                    vItem.item.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
                  )
                "
                @select="selectOption(vItem.item)"
                @mouseenter="
                  highlightedIndex = filteredOptions.findIndex((o) => o.value === vItem.item.value)
                "
              >
                <div class="flex flex-col min-w-0 pr-2">
                  <span class="truncate">{{ vItem.item.label }}</span>
                  <span
                    v-if="vItem.item.description"
                    class="text-[0.7rem] text-text-muted truncate"
                  >
                    {{ vItem.item.description }}
                  </span>
                </div>
                <ComboboxItemIndicator>
                  <Icon name="check" size="xs" class="text-primary ml-2 font-bold shrink-0" />
                </ComboboxItemIndicator>
              </ComboboxItem>
            </div>
          </div>

          <!-- Cas 2 : Rendu standard (< 15 options) -->
          <template v-else-if="filteredOptions.length > 0">
            <ComboboxItem
              v-for="opt in filteredOptions"
              :key="String(opt.value)"
              :value="String(opt.value)"
              :disabled="opt.disabled"
              :class="
                cn(
                  'relative flex items-center justify-between w-full min-h-[40px] py-2 px-3 rounded-lg text-sm select-none cursor-pointer outline-none transition-colors text-text-primary',
                  String(opt.value) === String(model)
                    ? 'bg-primary/15 font-semibold text-primary'
                    : 'hover:bg-bg-surface-hover',
                  filteredOptions[highlightedIndex]?.value === opt.value && 'bg-bg-surface-hover',
                  opt.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
                )
              "
              @select="selectOption(opt)"
              @mouseenter="
                highlightedIndex = filteredOptions.findIndex((o) => o.value === opt.value)
              "
            >
              <div class="flex flex-col min-w-0 pr-2">
                <span class="truncate">{{ opt.label }}</span>
                <span v-if="opt.description" class="text-[0.7rem] text-text-muted truncate">
                  {{ opt.description }}
                </span>
              </div>
              <ComboboxItemIndicator>
                <Icon name="check" size="xs" class="text-primary ml-2 font-bold shrink-0" />
              </ComboboxItemIndicator>
            </ComboboxItem>
          </template>

          <!-- État vide accessible -->
          <ComboboxEmpty
            v-if="filteredOptions.length === 0"
            class="py-6 px-3 text-center text-xs text-text-muted select-none"
          >
            Aucun résultat trouvé pour "{{ searchTerm }}"
          </ComboboxEmpty>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
