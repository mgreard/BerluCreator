<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, useTemplateRef, nextTick } from 'vue'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription
} from 'reka-ui'
import { cn } from '@/shared/utils/cn'
import { Icon } from '@/components/ui/icon'
import type { CommandPaletteProps, CommandPaletteEmits, CommandGroup, CommandItem } from './types'
import { commandPaletteContentVariants } from './variants'

const open = defineModel<boolean>('open', { default: false })
const searchQuery = ref('')
const activeIndex = ref(0)
const inputRef = useTemplateRef<HTMLInputElement>('searchInputRef')

const {
  groups = [],
  items = [],
  placeholder = 'Rechercher une commande, une page ou une action...',
  enableShortcut = true,
  size = 'md',
  class: className = undefined
} = defineProps<CommandPaletteProps>()

const emit = defineEmits<CommandPaletteEmits>()

// Raccourci clavier global ⌘K / Ctrl+K
function handleGlobalKeydown(e: KeyboardEvent) {
  if (!enableShortcut) return
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value = !open.value
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleGlobalKeydown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleGlobalKeydown)
  }
})

// Focus automatique lors de l'ouverture
function handleOpenAutoFocus() {
  searchQuery.value = ''
  activeIndex.value = 0
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// Normalisation des groupes
const allGroups = computed<CommandGroup[]>(() => {
  if (groups.length > 0) return groups
  if (items.length > 0) return [{ name: 'Commandes', items }]
  return []
})

// Filtrage instantané des éléments
const filteredGroups = computed<CommandGroup[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return allGroups.value

  return allGroups.value
    .map((group) => {
      const filteredItems = group.items.filter((item) => {
        return (
          item.label.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query)) ||
          group.name.toLowerCase().includes(query)
        )
      })
      return {
        ...group,
        items: filteredItems
      }
    })
    .filter((group) => group.items.length > 0)
})

// Liste aplatie des éléments filtrés pour la navigation au clavier
const flatFilteredItems = computed<CommandItem[]>(() => {
  return filteredGroups.value.flatMap((g) => g.items.filter((i) => !i.disabled))
})

function executeItem(item: CommandItem) {
  if (item.disabled) return
  open.value = false
  emit('select', item)
  if (item.onSelect) {
    item.onSelect()
  }
}

function handleKeyDown(e: KeyboardEvent) {
  const total = flatFilteredItems.value.length
  if (total === 0) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % total
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + total) % total
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const target = flatFilteredItems.value[activeIndex.value]
    if (target) {
      executeItem(target)
    }
  } else if (e.key === 'Escape') {
    open.value = false
  }
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <!-- Overlay avec flou -->
      <DialogOverlay
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      />

      <!-- Fenêtre Palette de commandes -->
      <DialogContent
        :class="cn(commandPaletteContentVariants({ size }), className)"
        @open-auto-focus="handleOpenAutoFocus"
      >
        <!-- Accessibilité titre masqué visuellement -->
        <DialogTitle class="sr-only">Palette de commandes</DialogTitle>
        <DialogDescription class="sr-only"
          >Recherchez et exécutez des commandes système rapidement.</DialogDescription
        >

        <div class="flex flex-col w-full" @keydown="handleKeyDown">
          <!-- Barre de recherche supérieure -->
          <div
            class="flex items-center gap-3 px-5 py-4 border-b border-border-default bg-bg-surface/40"
          >
            <Icon name="search" size="sm" class="text-text-muted select-none shrink-0" />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              :placeholder="placeholder"
              class="flex-1 bg-transparent border-0 text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none"
              autocomplete="off"
              spellcheck="false"
            />
            <button
              v-if="searchQuery"
              class="text-xs text-text-muted hover:text-text-primary p-1 rounded cursor-pointer touch-manipulation flex items-center justify-center"
              aria-label="Effacer la recherche"
              @click="searchQuery = ''"
            >
              <Icon name="close" size="xs" />
            </button>
            <kbd
              class="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg border border-border-default bg-bg-surface text-[10px] font-mono text-text-muted font-bold shadow-glass-xs"
            >
              ESC
            </kbd>
          </div>

          <!-- Liste des résultats groupés -->
          <div class="max-h-80 overflow-y-auto overscroll-contain p-2 flex flex-col gap-3">
            <template v-if="filteredGroups.length > 0">
              <div v-for="group in filteredGroups" :key="group.name" class="flex flex-col gap-1">
                <!-- Libellé du groupe -->
                <span
                  class="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-text-muted/80"
                >
                  {{ group.name }}
                </span>

                <!-- Éléments de commande -->
                <button
                  v-for="item in group.items"
                  :key="item.id"
                  type="button"
                  :disabled="item.disabled"
                  :class="
                    cn(
                      'flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl text-left transition-all duration-100 min-h-[44px] cursor-pointer touch-manipulation',
                      flatFilteredItems[activeIndex]?.id === item.id
                        ? 'bg-primary text-text-inverse shadow-glass-sm'
                        : 'hover:bg-bg-surface-hover text-text-primary',
                      item.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
                    )
                  "
                  @click="executeItem(item)"
                  @mouseenter="activeIndex = flatFilteredItems.findIndex((i) => i.id === item.id)"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <Icon v-if="item.icon" :name="item.icon" size="sm" class="shrink-0" />
                    <div class="flex flex-col min-w-0">
                      <span class="text-xs font-semibold truncate">{{ item.label }}</span>
                      <span
                        v-if="item.description"
                        :class="[
                          'text-[11px] truncate',
                          flatFilteredItems[activeIndex]?.id === item.id
                            ? 'text-text-inverse/80'
                            : 'text-text-muted'
                        ]"
                      >
                        {{ item.description }}
                      </span>
                    </div>
                  </div>

                  <!-- Raccourci clavier de l'action -->
                  <kbd
                    v-if="item.shortcut"
                    :class="[
                      'shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold shadow-glass-xs border transition-colors',
                      flatFilteredItems[activeIndex]?.id === item.id
                        ? 'bg-white/20 border-white/30 text-text-inverse'
                        : 'bg-bg-surface/80 border-border-default text-text-muted'
                    ]"
                  >
                    {{ item.shortcut }}
                  </kbd>
                </button>
              </div>
            </template>

            <!-- État aucun résultat -->
            <div
              v-else
              class="py-10 text-center flex flex-col items-center justify-center gap-2 text-text-muted"
            >
              <span class="text-2xl">🔍</span>
              <span class="text-xs font-medium"
                >Aucune commande trouvée pour "{{ searchQuery }}"</span
              >
            </div>
          </div>

          <!-- Pied d'aide clavier -->
          <div
            class="flex items-center justify-between px-5 py-3 border-t border-border-default/60 bg-bg-surface/20 text-[11px] text-text-muted"
          >
            <div class="flex items-center gap-3">
              <span class="flex items-center gap-1"
                ><kbd
                  class="font-mono bg-bg-surface px-1.5 py-0.5 rounded border border-border-default text-[10px]"
                  >↑↓</kbd
                >
                Naviguer</span
              >
              <span class="flex items-center gap-1"
                ><kbd
                  class="font-mono bg-bg-surface px-1.5 py-0.5 rounded border border-border-default text-[10px]"
                  >↵</kbd
                >
                Valider</span
              >
            </div>
            <span class="flex items-center gap-1"
              ><kbd
                class="font-mono bg-bg-surface px-1.5 py-0.5 rounded border border-border-default text-[10px]"
                >⌘K</kbd
              >
              Basculer</span
            >
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
