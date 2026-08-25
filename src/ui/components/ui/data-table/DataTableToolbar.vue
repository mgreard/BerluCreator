<script setup lang="ts" generic="T extends object">
import { SearchInput } from '@/components/ui/search-input'
import { Popover } from '@/components/ui/popover'
import { DropdownMenu } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import type { DataTableColumn, DataTableToolbarProps } from './types'

const {
  variant,
  searchable,
  searchPlaceholder,
  enableColumnVisibility,
  columnVisibilityLabel,
  columns,
  columnVisibility,
  grouping,
  activeFiltersCount,
  exportable,
  exportMenuItems,
  refreshable,
  loading,
  isFetching,
  selectedCount,
  totalCount,
  visibleColumns
} = defineProps<DataTableToolbarProps<T>>()

const searchQuery = defineModel<string>('searchQuery', { required: true })

const emit = defineEmits<{
  (event: 'set-column-visibility', key: string, visible: boolean): void
  (event: 'set-all-columns-visibility', visible: boolean): void
  (event: 'remove-grouping', key: string): void
  (event: 'clear-grouping'): void
  (event: 'clear-filters'): void
  (event: 'refresh'): void
}>()

defineSlots<{
  toolbar(props: {
    selectedCount: number
    totalCount: number
    searchQuery: string
    visibleColumns: DataTableColumn<T>[]
    activeFiltersCount: number
    isFetching: boolean
  }): unknown
}>()

function getColumnLabel(key: string): string {
  return columns.find((column) => column.key === key)?.label ?? key
}

function isColumnVisible(key: string): boolean {
  return columnVisibility[key] !== false
}
</script>

<template>
  <div
    :class="
      cn(
        'px-4 py-3 border-b border-border-default flex items-center justify-between gap-3 flex-wrap',
        variant === 'glass' ? 'bg-bg-surface/40 backdrop-blur-md' : 'bg-bg-surface'
      )
    "
  >
    <div class="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs">
      <SearchInput
        v-if="searchable"
        v-model="searchQuery"
        :placeholder="searchPlaceholder"
        size="sm"
        class="w-full"
      />
    </div>

    <div class="flex items-center gap-2 ml-auto">
      <Popover v-if="enableColumnVisibility" width="sm" align="end">
        <template #trigger>
          <Button
            variant="secondary"
            size="sm"
            class="flex items-center gap-1.5 text-xs font-semibold"
          >
            <Icon name="view_column" size="xs" />
            <span>{{ columnVisibilityLabel }}</span>
          </Button>
        </template>

        <div class="space-y-3 p-1">
          <div
            class="flex items-center justify-between pb-2 border-b border-border-default/60 pr-6"
          >
            <span class="text-xs font-semibold text-text-muted uppercase tracking-wider"
              >Colonnes</span
            >
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="text-xs text-primary hover:underline font-medium px-1 cursor-pointer"
                @click="emit('set-all-columns-visibility', true)"
              >
                Tout afficher
              </button>
              <span class="text-text-muted text-xs">•</span>
              <button
                type="button"
                class="text-xs text-text-muted hover:text-text-primary hover:underline px-1 cursor-pointer"
                @click="emit('set-all-columns-visibility', false)"
              >
                Tout masquer
              </button>
            </div>
          </div>

          <div class="max-h-56 overflow-y-auto space-y-1 pr-1">
            <label
              v-for="column in columns"
              :key="column.key"
              class="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-bg-surface-hover/70 cursor-pointer transition-colors text-xs font-medium"
            >
              <Checkbox
                :model-value="isColumnVisible(column.key)"
                size="sm"
                @update:model-value="
                  (value) => emit('set-column-visibility', column.key, Boolean(value))
                "
              />
              <span class="truncate">{{ column.label }}</span>
            </label>
          </div>
        </div>
      </Popover>

      <div v-if="grouping.length > 0" class="flex items-center gap-1.5 flex-wrap">
        <div
          v-for="groupingKey in grouping"
          :key="`grouping-${groupingKey}`"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20 shadow-xs animate-in fade-in"
        >
          <Icon name="layers" size="xs" />
          <span>{{ getColumnLabel(groupingKey) }}</span>
          <button
            type="button"
            :aria-label="`Retirer le groupement par ${getColumnLabel(groupingKey)}`"
            class="hover:text-primary-foreground hover:bg-primary rounded-full w-3.5 h-3.5 inline-flex items-center justify-center transition-colors cursor-pointer text-[10px] ml-0.5"
            @click="emit('remove-grouping', groupingKey)"
          >
            ×
          </button>
        </div>
        <button
          type="button"
          class="text-[11px] text-text-muted hover:text-text-primary hover:underline ml-1 cursor-pointer"
          @click="emit('clear-grouping')"
        >
          Dégrouper
        </button>
      </div>

      <Button
        v-if="activeFiltersCount > 0"
        variant="ghost"
        size="sm"
        class="flex items-center gap-1.5 text-xs text-danger font-semibold hover:bg-danger-bg"
        @click="emit('clear-filters')"
      >
        <Icon name="close" size="xs" />
        <span>Effacer filtres ({{ activeFiltersCount }})</span>
      </Button>

      <DropdownMenu v-if="exportable" :items="exportMenuItems" align="end" width="md">
        <template #trigger="{ open }">
          <Button
            variant="secondary"
            size="sm"
            :active="open"
            aria-label="Exporter les données du tableau"
            class="flex items-center gap-1.5 text-xs font-semibold"
          >
            <Icon name="file_download" size="xs" />
            <span>Exporter</span>
          </Button>
        </template>
      </DropdownMenu>

      <Button
        v-if="refreshable"
        variant="ghost"
        size="sm"
        :disabled="loading || isFetching"
        aria-label="Actualiser les données"
        class="flex items-center gap-1.5 text-xs font-semibold"
        @click="emit('refresh')"
      >
        <Icon name="refresh" size="xs" :class="isFetching ? 'animate-spin' : ''" />
        <span class="sr-only sm:not-sr-only">Actualiser</span>
      </Button>

      <slot
        name="toolbar"
        :selected-count="selectedCount"
        :total-count="totalCount"
        :search-query="searchQuery"
        :visible-columns="visibleColumns"
        :active-filters-count="activeFiltersCount"
        :is-fetching="isFetching"
      />
    </div>
  </div>
</template>
