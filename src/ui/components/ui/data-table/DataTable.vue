<script setup lang="ts" generic="T extends Record<string, any> = any">
import { ref, computed, useTemplateRef, useSlots, type Slots } from 'vue'
import { cva } from 'class-variance-authority'
import {
  useTable,
  tableFeatures,
  rowSortingFeature,
  rowSelectionFeature,
  rowPaginationFeature,
  rowExpandingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  columnVisibilityFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnGroupingFeature,
  createGroupedRowModel,
  rowAggregationFeature,
  createSortedRowModel,
  createPaginatedRowModel,
  createFilteredRowModel,
  createExpandedRowModel,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type ExpandedState,
  type ColumnVisibilityState,
  type ColumnFiltersState,
  type ColumnSizingState,
  type GroupingState,
  type Updater
} from '@tanstack/vue-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { SearchInput } from '@/components/ui/search-input'
import DataTableCell from './DataTableCell.vue'
import DataTableToolbar from './DataTableToolbar.vue'
import { Pagination } from '@/components/ui/pagination'
import { Popover } from '@/components/ui/popover'
import type { DropdownMenuItemDef } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/shared/utils/cn'
import { useVirtualGrid } from '@/shared/composables/useVirtualGrid'
import { exportToCsv, exportToJson } from '@/shared/utils/exportDataTable'
import type {
  DataTableColumn,
  DataTableProps,
  SortOrder,
  ColumnPinned,
  CellEditType,
  ColumnFilterType,
  DataTableSelectOption,
  ColumnAggregationType,
  ActiveEditingCell
} from './types'

const tableContainerVariants = cva(
  '@container relative w-full overflow-hidden rounded-xl border border-border-default shadow-xs bg-bg-surface select-normal',
  {
    variants: {
      variant: {
        default: 'bg-bg-surface',
        striped: 'bg-bg-surface',
        bordered: 'bg-bg-surface border border-border-default',
        glass:
          'glass-interactive backdrop-blur-xl bg-bg-surface/75 border border-border-default/70 shadow-glass-md'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

const slots: Slots = useSlots()

// Two-way bindings modernes Vue 3.5
const dataModel = defineModel<T[]>('data', { default: () => [] })
const defaultModel = defineModel<T[]>({ default: () => [] })
const selectedKeys = defineModel<(string | number)[]>('selectedKeys', { default: () => [] })
const selectedKey = defineModel<string | number | null>('selectedKey', { default: null })
const expandedKeys = defineModel<(string | number)[]>('expandedKeys', { default: () => [] })
const columnFiltersModel = defineModel<Record<string, unknown>>('columnFilters', {
  default: () => ({})
})
const columnSizingModel = defineModel<Record<string, number>>('columnSizing', {
  default: () => ({})
})
const groupingModel = defineModel<string[]>('grouping', { default: () => [] })
const sortBy = defineModel<string | null>('sortBy', { default: null })
const sortOrder = defineModel<SortOrder>('sortOrder', { default: null })
const editingCell = defineModel<ActiveEditingCell | null>('editingCell', { default: null })
const searchQuery = defineModel<string>('search', { default: '' })
const columnVisibilityModel = defineModel<Record<string, boolean>>('columnVisibility', {
  default: () => ({})
})
const pageModel = defineModel<number>('page', { default: 1 })
const pageSizeModel = defineModel<number>('pageSize', { default: 10 })

const {
  columns = [],
  data = [],
  keyField = 'id',
  variant = 'default',
  size = 'md',
  stickyHeader = false,
  selectable = false,
  selectionMode = 'multiple',
  selectOnClickRow = false,
  expandable = false,
  canExpand = undefined,
  expandOnClickRow = false,
  loading = false,
  loadingRows = 5,
  hoverable = true,
  emptyText = 'Aucune donnée disponible',
  virtual = false,
  rowHeight = 48,
  virtualHeight = '420px',
  searchable = false,
  searchPlaceholder = 'Rechercher...',
  enableColumnVisibility = false,
  columnVisibilityLabel = 'Colonnes',
  pagination = false,
  manualPagination = false,
  manualSorting = false,
  manualFiltering = false,
  totalRows = undefined,
  pageCount = undefined,
  isFetching = false,
  isError = false,
  errorText = 'Une erreur est survenue lors du chargement des données',
  refreshable = false,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  showPaginationSummary = true,
  showPageSizeSelect = true,
  paginationVariant = 'default',
  paginationSize = 'md',
  exportable = false,
  exportFilename = 'export-donnees',
  exportFormats = ['csv', 'json'],
  resizable = false,
  columnResizeMode = 'onChange',
  enableGrouping = false,
  groupBy = undefined,
  class: className = undefined
} = defineProps<DataTableProps<T>>()

if (groupBy && groupingModel.value.length === 0) {
  groupingModel.value = Array.isArray(groupBy) ? groupBy : [groupBy]
}

const emit = defineEmits<{
  (e: 'row-click', item: T, index: number): void
  (e: 'sort-change', column: DataTableColumn<T>, order: SortOrder): void
  (e: 'cell-change', item: T, columnKey: string, newValue: unknown, previousValue: unknown): void
  (e: 'search-change', query: string): void
  (e: 'column-visibility-change', visibility: Record<string, boolean>): void
  (e: 'column-filter-change', filters: Record<string, unknown>): void
  (
    e: 'column-resize-change',
    columnKey: string,
    width: number,
    columnSizing: Record<string, number>
  ): void
  (
    e: 'select-change',
    selectedKey: string | number | null,
    selectedKeys: (string | number)[],
    item?: T
  ): void
  (e: 'grouping-change', grouping: string[]): void
  (e: 'page-change', page: number, pageSize: number): void
  (e: 'expand-change', item: T, isExpanded: boolean, expandedKeys: (string | number)[]): void
  (e: 'export', format: 'csv' | 'json', count: number, filename: string): void
  (e: 'refresh'): void
}>()

// Référence vers le conteneur de défilement
const scrollContainerRef = useTemplateRef<HTMLElement>('scrollContainerRef')
const tableRef = useTemplateRef<HTMLTableElement>('tableRef')

// Source de données active (dataModel ou defaultModel ou prop data)
const sourceData = computed<T[]>(() => {
  if (dataModel.value && dataModel.value.length > 0) return dataModel.value
  if (defaultModel.value && defaultModel.value.length > 0) return defaultModel.value
  return data
})

// Normalisation des colonnes pour TanStack Table
const normalizedColumns = computed<DataTableColumn<T>[]>(() => {
  return (columns as unknown[]).map((col) => {
    const c = col as Record<string, unknown>
    return {
      key: (c.key ?? c.accessorKey ?? c.id ?? '') as string,
      label: (c.label ?? c.header ?? c.key ?? '') as string,
      sortable: Boolean(c.sortable ?? c.enableSorting),
      resizable: c.resizable !== undefined ? Boolean(c.resizable) : undefined,
      align: (c.align ?? 'left') as 'left' | 'center' | 'right',
      width: c.width as string | undefined,
      minWidth: c.minWidth as string | undefined,
      maxWidth: c.maxWidth as string | undefined,
      pinned: (c.pinned ?? false) as ColumnPinned,
      editable: Boolean(c.editable),
      editType: (c.editType ?? 'text') as CellEditType,
      editOptions: c.editOptions as DataTableSelectOption[] | undefined,
      filterable: Boolean(c.filterable),
      filterType: (c.filterType ?? 'text') as ColumnFilterType,
      filterOptions: c.filterOptions as DataTableSelectOption[] | undefined,
      filterPlaceholder: c.filterPlaceholder as string | undefined,
      groupable: c.groupable !== undefined ? Boolean(c.groupable) : undefined,
      aggregation: c.aggregation as ColumnAggregationType | undefined,
      aggregationLabel: c.aggregationLabel as string | undefined,
      class: c.class as string | undefined,
      headerClass: c.headerClass as string | undefined,
      formatter: c.formatter as ((value: unknown, item: T) => unknown) | undefined
    }
  })
})

// Configuration des features TanStack Table v9
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowSelectionFeature,
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  columnVisibilityFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnGroupingFeature,
  groupedRowModel: createGroupedRowModel(),
  rowAggregationFeature
})

// Configuration des colonnes pour le moteur TanStack Table
const tanstackColumns = computed<ColumnDef<typeof features, T, unknown>[]>(() => {
  return normalizedColumns.value.map((col) => ({
    id: col.key,
    accessorKey: col.key,
    header: col.label,
    enableSorting: col.sortable ?? false,
    enableResizing: col.resizable !== undefined ? col.resizable : resizable,
    enableGrouping:
      col.groupable !== undefined
        ? col.groupable
        : enableGrouping || groupingModel.value.length > 0,
    size: col.width ? parsePixelValue(col.width, 150) : undefined,
    minSize: col.minWidth ? parsePixelValue(col.minWidth, 60) : 60,
    maxSize: col.maxWidth ? parsePixelValue(col.maxWidth, 2000) : 2000,
    enableColumnFilter: col.filterable ?? false,
    filterFn: (row, columnId: string, filterValue: unknown) => {
      const cellValue = row.getValue(columnId)
      if (filterValue === undefined || filterValue === null || filterValue === '') return true
      if (col.filterType === 'multi-select' && Array.isArray(filterValue)) {
        if (filterValue.length === 0) return true
        return filterValue.includes(cellValue)
      }
      if (col.filterType === 'select') {
        return cellValue === filterValue
      }
      if (col.filterType === 'boolean') {
        if (filterValue === undefined || filterValue === null || filterValue === '') return true
        const boolFilter = filterValue === true || filterValue === 'true'
        const boolCell = Boolean(cellValue)
        return boolCell === boolFilter
      }
      if (col.filterType === 'number-range' && typeof filterValue === 'object') {
        const { min, max } = filterValue as { min?: number | string; max?: number | string }
        const hasMin = min !== undefined && min !== '' && !isNaN(Number(min))
        const hasMax = max !== undefined && max !== '' && !isNaN(Number(max))
        if (!hasMin && !hasMax) return true
        if (
          cellValue === null ||
          cellValue === undefined ||
          cellValue === '' ||
          isNaN(Number(cellValue))
        ) {
          return false
        }
        const num = Number(cellValue)
        if (hasMin && num < Number(min)) return false
        if (hasMax && num > Number(max)) return false
        return true
      }
      return String(cellValue ?? '')
        .toLowerCase()
        .includes(String(filterValue).toLowerCase())
    }
  }))
})

// Synchronisation de l'état de tri TanStack
const sortingState = computed<SortingState>({
  get: () => {
    if (sortBy.value && sortOrder.value) {
      return [{ id: sortBy.value, desc: sortOrder.value === 'desc' }]
    }
    return []
  },
  set: (val) => {
    if (val.length > 0) {
      const first = val[0]
      sortBy.value = first.id
      sortOrder.value = first.desc ? 'desc' : 'asc'
    } else {
      sortBy.value = null
      sortOrder.value = null
    }
  }
})

// Synchronisation de la sélection TanStack
const rowSelectionState = computed<RowSelectionState>({
  get: () => {
    const sel: RowSelectionState = {}
    sourceData.value.forEach((item, idx) => {
      const key = getItemKey(item, idx)
      if (selectionMode === 'single') {
        if (selectedKey.value === key || selectedKeys.value[0] === key) {
          sel[String(idx)] = true
        }
      } else {
        if (selectedKeys.value.includes(key)) {
          sel[String(idx)] = true
        }
      }
    })
    return sel
  },
  set: (val) => {
    const newKeys: (string | number)[] = []
    Object.keys(val).forEach((idxStr) => {
      if (val[idxStr]) {
        const idx = Number(idxStr)
        const item = sourceData.value[idx]
        if (item) {
          newKeys.push(getItemKey(item, idx))
        }
      }
    })
    if (selectionMode === 'single') {
      const single = newKeys.length > 0 ? newKeys[newKeys.length - 1] : null
      selectedKey.value = single
      selectedKeys.value = single !== null ? [single] : []
    } else {
      selectedKeys.value = newKeys
      selectedKey.value = newKeys.length > 0 ? newKeys[0] : null
    }
  }
})

// Synchronisation de l'expansion TanStack
const expandedState = computed<ExpandedState>({
  get: () => {
    const exp: Record<string, boolean> = {}
    sourceData.value.forEach((item, idx) => {
      const key = getItemKey(item, idx)
      if (expandedKeys.value.includes(key)) {
        exp[String(idx)] = true
      }
    })
    return exp
  },
  set: (val) => {
    if (val === true) {
      expandedKeys.value = sourceData.value
        .filter((item, idx) => canItemExpand(item, idx))
        .map((item, idx) => getItemKey(item, idx))
    } else {
      const newKeys: (string | number)[] = []
      Object.keys(val).forEach((idxStr) => {
        if (val[idxStr]) {
          const idx = Number(idxStr)
          const item = sourceData.value[idx]
          if (item) {
            newKeys.push(getItemKey(item, idx))
          }
        }
      })
      expandedKeys.value = newKeys
    }
  }
})

// Synchronisation des filtres de colonnes TanStack
const columnFiltersState = computed<ColumnFiltersState>({
  get: () => {
    const filters: ColumnFiltersState = []
    Object.entries(columnFiltersModel.value).forEach(([id, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        (!Array.isArray(value) || value.length > 0)
      ) {
        filters.push({ id, value })
      }
    })
    return filters
  },
  set: (val) => {
    const next: Record<string, unknown> = {}
    val.forEach((f) => {
      next[f.id] = f.value
    })
    columnFiltersModel.value = next
  }
})

const table = useTable({
  features,
  data: sourceData as unknown as T[],
  columns: tanstackColumns,
  manualPagination,
  manualSorting,
  manualFiltering,
  enableColumnResizing: resizable,
  enableMultiRowSelection: selectionMode === 'multiple',
  enableGrouping: enableGrouping || groupingModel.value.length > 0,
  columnResizeMode: columnResizeMode,
  rowCount: manualPagination && totalRows !== undefined ? totalRows : undefined,
  pageCount: pageCount,
  state: {
    get sorting() {
      return sortingState.value
    },
    get rowSelection() {
      return rowSelectionState.value
    },
    get expanded() {
      return expandedState.value
    },
    get columnFilters() {
      return columnFiltersState.value
    },
    get columnSizing() {
      return columnSizingModel.value
    },
    get grouping() {
      return groupingModel.value
    },
    get pagination() {
      return {
        pageIndex: Math.max(0, pageModel.value - 1),
        pageSize: pageSizeModel.value
      }
    },
    get globalFilter() {
      return searchQuery.value
    },
    get columnVisibility() {
      return columnVisibilityModel.value
    }
  },
  onGroupingChange: (updaterOrValue: Updater<GroupingState>) => {
    const nextGrouping =
      typeof updaterOrValue === 'function' ? updaterOrValue(groupingModel.value) : updaterOrValue
    groupingModel.value = nextGrouping
    emit('grouping-change', nextGrouping)
  },
  onColumnSizingChange: (updaterOrValue: Updater<ColumnSizingState>) => {
    const nextSizing =
      typeof updaterOrValue === 'function'
        ? updaterOrValue(columnSizingModel.value)
        : updaterOrValue
    columnSizingModel.value = nextSizing
  },
  onSortingChange: (updaterOrValue: Updater<SortingState>) => {
    const nextSorting =
      typeof updaterOrValue === 'function' ? updaterOrValue(sortingState.value) : updaterOrValue
    sortingState.value = nextSorting
    if (nextSorting.length > 0) {
      const col = normalizedColumns.value.find((c) => c.key === nextSorting[0].id)
      if (col) {
        emit('sort-change', col, nextSorting[0].desc ? 'desc' : 'asc')
      }
    } else {
      const col = normalizedColumns.value.find((c) => c.key === sortBy.value)
      if (col) {
        emit('sort-change', col, null)
      }
    }
  },
  onRowSelectionChange: (updaterOrValue: Updater<RowSelectionState>) => {
    const nextSelection =
      typeof updaterOrValue === 'function'
        ? updaterOrValue(rowSelectionState.value)
        : updaterOrValue
    rowSelectionState.value = nextSelection
  },
  onExpandedChange: (updaterOrValue: Updater<ExpandedState>) => {
    const nextExpanded =
      typeof updaterOrValue === 'function' ? updaterOrValue(expandedState.value) : updaterOrValue
    expandedState.value = nextExpanded
  },
  onColumnFiltersChange: (updaterOrValue: Updater<ColumnFiltersState>) => {
    const nextFilters =
      typeof updaterOrValue === 'function'
        ? updaterOrValue(columnFiltersState.value)
        : updaterOrValue
    columnFiltersState.value = nextFilters
    emit('column-filter-change', columnFiltersModel.value)
  },
  onPaginationChange: (updaterOrValue: Updater<{ pageIndex: number; pageSize: number }>) => {
    const current = {
      pageIndex: Math.max(0, pageModel.value - 1),
      pageSize: pageSizeModel.value
    }
    const next = typeof updaterOrValue === 'function' ? updaterOrValue(current) : updaterOrValue
    pageModel.value = next.pageIndex + 1
    pageSizeModel.value = next.pageSize
    emit('page-change', pageModel.value, pageSizeModel.value)
  },
  onGlobalFilterChange: (updaterOrValue: Updater<string>) => {
    const next =
      typeof updaterOrValue === 'function' ? updaterOrValue(searchQuery.value) : updaterOrValue
    searchQuery.value = next
    emit('search-change', next)
  },
  onColumnVisibilityChange: (updaterOrValue: Updater<ColumnVisibilityState>) => {
    const next =
      typeof updaterOrValue === 'function'
        ? updaterOrValue(columnVisibilityModel.value)
        : updaterOrValue
    columnVisibilityModel.value = next
    emit('column-visibility-change', next)
  },
  initialState: {
    pagination: {
      pageIndex: 0,
      pageSize: pageSize
    }
  }
})

// Nombre total de lignes effectif (tenant compte des filtres TanStack en mode client)
const effectiveTotalRows = computed(() => {
  if (manualPagination && totalRows !== undefined) return totalRows
  if (manualPagination && pageCount !== undefined) return pageCount * pageSizeModel.value
  const filteredModel = table.getFilteredRowModel()
  if (filteredModel && Array.isArray(filteredModel.rows)) {
    return filteredModel.rows.length
  }
  return sourceData.value.length
})

// Fonctions d'aide aux filtres de colonnes
function getColumnFilterValue(key: string): unknown {
  return columnFiltersModel.value[key]
}

function setColumnFilterValue(key: string, value: unknown) {
  const next = { ...columnFiltersModel.value }
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  ) {
    delete next[key]
  } else {
    next[key] = value
  }
  columnFiltersModel.value = next
  emit('column-filter-change', next)
}

function clearColumnFilter(key: string) {
  const next = { ...columnFiltersModel.value }
  delete next[key]
  columnFiltersModel.value = next
  emit('column-filter-change', next)
}

function toggleMultiSelectFilter(key: string, optionValue: string | number | boolean) {
  const current = Array.isArray(columnFiltersModel.value[key])
    ? [...(columnFiltersModel.value[key] as (string | number | boolean)[])]
    : []
  const idx = current.indexOf(optionValue)
  if (idx > -1) {
    current.splice(idx, 1)
  } else {
    current.push(optionValue)
  }
  setColumnFilterValue(key, current)
}

function setNumberRangeFilter(key: string, bound: 'min' | 'max', val: string | number | undefined) {
  const current =
    (columnFiltersModel.value[key] as { min?: number | string; max?: number | string }) || {}
  const next = { ...current, [bound]: val }
  if ((next.min === undefined || next.min === '') && (next.max === undefined || next.max === '')) {
    setColumnFilterValue(key, undefined)
  } else {
    setColumnFilterValue(key, next)
  }
}

function isFilterActive(key: string): boolean {
  const val = columnFiltersModel.value[key]
  if (val === undefined || val === null || val === '') return false
  if (Array.isArray(val)) return val.length > 0
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>
    return Object.values(obj).some((v) => v !== undefined && v !== '')
  }
  return true
}

function clearAllColumnFilters() {
  columnFiltersModel.value = {}
  emit('column-filter-change', {})
}

const activeFiltersCount = computed(() => {
  return Object.keys(columnFiltersModel.value).filter((k) => isFilterActive(k)).length
})

// Colonnes visibles filtrées selon columnVisibility
const visibleColumns = computed<DataTableColumn<T>[]>(() => {
  return normalizedColumns.value.filter((col) => columnVisibilityModel.value[col.key] !== false)
})

function setColumnVisibility(key: string, visible: boolean) {
  columnVisibilityModel.value = {
    ...columnVisibilityModel.value,
    [key]: visible
  }
  emit('column-visibility-change', columnVisibilityModel.value)
}

function setAllColumnsVisibility(visible: boolean) {
  const next: Record<string, boolean> = {}
  normalizedColumns.value.forEach((col) => {
    next[col.key] = visible
  })
  columnVisibilityModel.value = next
  emit('column-visibility-change', next)
}

// Exportation de données
function exportData(
  format: 'csv' | 'json' = 'csv',
  options?: { selectedOnly?: boolean; filename?: string }
) {
  const isSelectedOnly = options?.selectedOnly ?? false
  const targetFilename = options?.filename || exportFilename

  let exportRows: T[] = []
  if (isSelectedOnly && selectedKeys.value.length > 0) {
    exportRows = sourceData.value.filter((item, idx) =>
      selectedKeys.value.includes(getItemKey(item, idx))
    )
  } else {
    const rowModel = table.getFilteredRowModel()
    exportRows =
      rowModel && rowModel.rows.length > 0
        ? rowModel.rows.map((row) => row.original)
        : sourceData.value
  }

  const cols = visibleColumns.value

  if (format === 'csv') {
    exportToCsv(exportRows, cols, targetFilename)
  } else if (format === 'json') {
    exportToJson(exportRows, cols, targetFilename)
  }

  emit('export', format, exportRows.length, targetFilename)
}

const exportMenuItems = computed<DropdownMenuItemDef[]>(() => {
  const items: DropdownMenuItemDef[] = []
  const hasSelection = selectedKeys.value.length > 0

  if (exportFormats.includes('csv')) {
    items.push({
      id: 'export-csv-all',
      label: 'Exporter en CSV (Toutes les lignes)',
      icon: 'description',
      onClick: () => exportData('csv', { selectedOnly: false })
    })
    if (hasSelection) {
      items.push({
        id: 'export-csv-selected',
        label: `Exporter en CSV (${selectedKeys.value.length} sélectionnée${selectedKeys.value.length > 1 ? 's' : ''})`,
        icon: 'checklist',
        onClick: () => exportData('csv', { selectedOnly: true })
      })
    }
  }

  if (exportFormats.includes('json')) {
    if (items.length > 0) {
      items.push({ type: 'separator' })
    }
    items.push({
      id: 'export-json-all',
      label: 'Exporter en JSON (Toutes les lignes)',
      icon: 'data_object',
      onClick: () => exportData('json', { selectedOnly: false })
    })
    if (hasSelection) {
      items.push({
        id: 'export-json-selected',
        label: `Exporter en JSON (${selectedKeys.value.length} sélectionnée${selectedKeys.value.length > 1 ? 's' : ''})`,
        icon: 'checklist',
        onClick: () => exportData('json', { selectedOnly: true })
      })
    }
  }

  return items
})

// Redimensionnement manuel des colonnes
const resizingColumnKey = ref<string | null>(null)

function parsePixelValue(val: string | number | undefined, defaultVal: number): number {
  if (val === undefined || val === null || val === '') return defaultVal
  if (typeof val === 'number') return val
  const parsed = parseFloat(val)
  return isNaN(parsed) ? defaultVal : parsed
}

function canResizeColumn(col: DataTableColumn<T>): boolean {
  if (col.resizable !== undefined) return col.resizable
  return resizable
}

function getColumnWidthStyle(col: DataTableColumn<T>) {
  const customWidth = columnSizingModel.value[col.key]
  const widthVal = customWidth !== undefined ? `${customWidth}px` : col.width

  return {
    width: widthVal,
    minWidth: col.minWidth,
    maxWidth: col.maxWidth,
    left: getColumnLeftOffset(col),
    right: getColumnRightOffset(col)
  }
}

function startColumnResize(colKey: string, event: MouseEvent | TouchEvent) {
  const col = normalizedColumns.value.find((c) => c.key === colKey)
  if (!col) return

  const startX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const targetEl = event.target as HTMLElement
  const thElement = targetEl.closest('th')
  const startWidth =
    columnSizingModel.value[colKey] ?? thElement?.getBoundingClientRect().width ?? 120

  const minWidth = parsePixelValue(col.minWidth, 60)
  const maxWidth = col.maxWidth ? parsePixelValue(col.maxWidth, 2000) : Infinity

  resizingColumnKey.value = colKey
  if (typeof document !== 'undefined') {
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  let currentWidth = startWidth

  const onMove = (moveEvent: MouseEvent | TouchEvent) => {
    const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX
    const deltaX = currentX - startX
    const rawWidth = startWidth + deltaX
    const clampedWidth = Math.round(Math.max(minWidth, Math.min(maxWidth, rawWidth)))
    currentWidth = clampedWidth

    if (columnResizeMode === 'onChange') {
      const nextSizing = { ...columnSizingModel.value, [colKey]: clampedWidth }
      columnSizingModel.value = nextSizing
      emit('column-resize-change', colKey, clampedWidth, nextSizing)
    }
  }

  const onEnd = () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }

    resizingColumnKey.value = null
    if (typeof document !== 'undefined') {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    const nextSizing = { ...columnSizingModel.value, [colKey]: currentWidth }
    columnSizingModel.value = nextSizing
    emit('column-resize-change', colKey, currentWidth, nextSizing)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
  }
}

function setColumnSize(key: string, width: number) {
  const next = { ...columnSizingModel.value, [key]: width }
  columnSizingModel.value = next
  emit('column-resize-change', key, width, next)
}

function resetColumnSizing() {
  columnSizingModel.value = {}
}

function getColumnSize(key: string): number | undefined {
  return columnSizingModel.value[key]
}

function isRowSelected(item: T, index: number): boolean {
  const key = getItemKey(item, index)
  if (selectionMode === 'single') {
    return (
      selectedKey.value === key || (selectedKey.value === null && selectedKeys.value.includes(key))
    )
  }
  return selectedKeys.value.includes(key)
}

function toggleRowSelection(item: T, index: number) {
  const key = getItemKey(item, index)
  if (selectionMode === 'single') {
    const isSelected = isRowSelected(item, index)
    const nextKey = isSelected ? null : key
    selectedKey.value = nextKey
    selectedKeys.value = nextKey !== null ? [nextKey] : []
    emit('select-change', nextKey, selectedKeys.value, nextKey !== null ? item : undefined)
  } else {
    const current = [...selectedKeys.value]
    const idx = current.indexOf(key)
    const isSelecting = idx === -1

    if (idx > -1) {
      current.splice(idx, 1)
    } else {
      current.push(key)
    }
    selectedKeys.value = current
    selectedKey.value = current.length > 0 ? current[0] : null
    emit('select-change', selectedKey.value, current, isSelecting ? item : undefined)
  }
}

function selectRow(key: string | number) {
  const item = sourceData.value.find((it, i) => getItemKey(it, i) === key)
  if (selectionMode === 'single') {
    selectedKey.value = key
    selectedKeys.value = [key]
    emit('select-change', key, [key], item)
  } else {
    if (!selectedKeys.value.includes(key)) {
      const next = [...selectedKeys.value, key]
      selectedKeys.value = next
      selectedKey.value = next[0]
      emit('select-change', selectedKey.value, next, item)
    }
  }
}

function deselectAll() {
  selectedKey.value = null
  selectedKeys.value = []
  emit('select-change', null, [])
}

const currentSelectableRows = computed<T[]>(() => {
  const filteredModel = table.getFilteredRowModel()
  if (filteredModel && Array.isArray(filteredModel.rows) && filteredModel.rows.length > 0) {
    return filteredModel.rows.map((row) => row.original)
  }
  return sourceData.value
})

const isAllSelected = computed(() => {
  if (selectionMode === 'single') return false
  const list = currentSelectableRows.value
  if (list.length === 0) return false
  return list.every((item, i) => selectedKeys.value.includes(getItemKey(item, i)))
})

const isSomeSelected = computed(() => {
  if (selectionMode === 'single') return false
  const list = currentSelectableRows.value
  if (list.length === 0) return false
  const count = list.filter((item, i) => selectedKeys.value.includes(getItemKey(item, i))).length
  return count > 0 && count < list.length
})

function toggleSelectAll() {
  if (selectionMode === 'single') return
  const list = currentSelectableRows.value
  if (list.length === 0) return

  if (isAllSelected.value) {
    const visibleKeys = list.map((item, i) => getItemKey(item, i))
    const remaining = selectedKeys.value.filter((k) => !visibleKeys.includes(k))
    selectedKeys.value = remaining
    selectedKey.value = remaining[0] ?? null
    emit('select-change', selectedKey.value, remaining)
  } else {
    const visibleKeys = list.map((item, i) => getItemKey(item, i))
    const combined = Array.from(new Set([...selectedKeys.value, ...visibleKeys]))
    selectedKeys.value = combined
    selectedKey.value = combined[0] ?? null
    emit('select-change', selectedKey.value, combined)
  }
}

function handleRowClick(item: T, index: number) {
  if (selectOnClickRow && selectable) {
    toggleRowSelection(item, index)
  }
  if (expandOnClickRow && canItemExpand(item, index)) {
    toggleRowExpansion(item, index)
  }
  emit('row-click', item, index)
}

function getItemKey(item: T, index: number): string | number {
  const val = (item as Record<string, unknown>)[keyField]
  return typeof val === 'string' || typeof val === 'number' ? val : index
}

function getColumnLabel(key: string | undefined): string {
  if (!key) return ''
  const col = normalizedColumns.value.find((c) => c.key === key)
  return col?.label ?? key
}

function setGrouping(cols: string[]) {
  groupingModel.value = cols
  emit('grouping-change', cols)
}

function toggleGrouping(key: string) {
  const current = [...groupingModel.value]
  const idx = current.indexOf(key)
  if (idx > -1) {
    current.splice(idx, 1)
  } else {
    current.push(key)
  }
  groupingModel.value = current
  emit('grouping-change', current)
}

function removeGrouping(key: string) {
  const current = groupingModel.value.filter((k) => k !== key)
  groupingModel.value = current
  emit('grouping-change', current)
}

function clearGrouping() {
  groupingModel.value = []
  emit('grouping-change', [])
}

function computeGroupAggregation(
  col: DataTableColumn<T>,
  row: { getLeafRows: () => Array<{ original: T }> }
): unknown {
  if (!col.aggregation) return null
  const leafRows = row.getLeafRows()
  const rawValues = leafRows.map((leafRow) => getCellValue(leafRow.original, col.key))
  const items = leafRows.map((leafRow) => leafRow.original)

  if (typeof col.aggregation === 'function') {
    return col.aggregation(rawValues, items)
  }

  const numValues = rawValues.map((v) => Number(v)).filter((v) => !isNaN(v))

  switch (col.aggregation) {
    case 'count':
      return rawValues.length
    case 'sum':
      return numValues.reduce((acc, v) => acc + v, 0)
    case 'avg':
      return numValues.length > 0
        ? (numValues.reduce((acc, v) => acc + v, 0) / numValues.length).toFixed(1)
        : 0
    case 'min':
      return numValues.length > 0 ? Math.min(...numValues) : 0
    case 'max':
      return numValues.length > 0 ? Math.max(...numValues) : 0
    default:
      return null
  }
}

// Lignes extensibles / Master-Detail
function canItemExpand(item: T, index: number): boolean {
  if (!expandable) return false
  if (canExpand) return canExpand(item, index)
  return true
}

function isRowExpanded(item: T, index: number): boolean {
  const key = getItemKey(item, index)
  return expandedKeys.value.includes(key)
}

function toggleRowExpansion(item: T, index: number) {
  if (!canItemExpand(item, index)) return
  const key = getItemKey(item, index)
  const current = [...expandedKeys.value]
  const idx = current.indexOf(key)
  const isExpanding = idx === -1

  if (idx > -1) {
    current.splice(idx, 1)
  } else {
    current.push(key)
  }
  expandedKeys.value = current
  emit('expand-change', item, isExpanding, current)
}

function toggleAllExpansion(expand?: boolean) {
  const list = sourceData.value
  const shouldExpand = expand ?? !isAllExpanded.value
  if (shouldExpand) {
    const allKeys = list
      .filter((item, idx) => canItemExpand(item, idx))
      .map((item, idx) => getItemKey(item, idx))
    expandedKeys.value = allKeys
  } else {
    expandedKeys.value = []
  }
}

const isAllExpanded = computed(() => {
  const expandableItems = sourceData.value.filter((item, idx) => canItemExpand(item, idx))
  if (expandableItems.length === 0) return false
  return expandableItems.every((item, idx) => expandedKeys.value.includes(getItemKey(item, idx)))
})

const isSomeExpanded = computed(() => {
  const expandableItems = sourceData.value.filter((item, idx) => canItemExpand(item, idx))
  if (expandableItems.length === 0) return false
  const count = expandableItems.filter((item, idx) =>
    expandedKeys.value.includes(getItemKey(item, idx))
  ).length
  return count > 0 && count < expandableItems.length
})

const totalColumnsCount = computed<number>(() => {
  return (
    visibleColumns.value.length +
    (selectable ? 1 : 0) +
    (expandable ? 1 : 0) +
    (slots.actions ? 1 : 0)
  )
})

const gridColOffset = computed(() => {
  return (selectable ? 1 : 0) + (expandable ? 1 : 0)
})

// Récupération des lignes depuis TanStack
const tableRows = computed(() => {
  return table.getRowModel().rows
})

// Virtualisation optionnelle avec useVirtualGrid
const { visibleItems, totalHeight, offsetY } = useVirtualGrid(tableRows, {
  itemHeight: rowHeight,
  columns: 1,
  overscan: 3,
  containerRef: scrollContainerRef
})

const displayRows = computed(() => {
  if (!virtual) {
    return tableRows.value.map((row, index) => ({ row, index }))
  }
  return visibleItems.value.map((visibleItem) => ({
    row: visibleItem.item,
    index: visibleItem.originalIndex
  }))
})

// Navigation au Clavier Roving Tabindex WAI-ARIA (role="grid")
const focusedRow = ref(0)
const focusedCol = ref(0)

const totalGridCols = computed(() => {
  return visibleColumns.value.length + gridColOffset.value + (slots.actions ? 1 : 0)
})

function handleGridKeyDown(event: KeyboardEvent) {
  const rowCount = displayRows.value.length
  const colCount = totalGridCols.value
  if (rowCount === 0 || colCount === 0) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      focusedRow.value = Math.min(rowCount - 1, focusedRow.value + 1)
      focusCurrentCell()
      break
    case 'ArrowUp':
      event.preventDefault()
      focusedRow.value = Math.max(0, focusedRow.value - 1)
      focusCurrentCell()
      break
    case 'ArrowRight':
      event.preventDefault()
      focusedCol.value = Math.min(colCount - 1, focusedCol.value + 1)
      focusCurrentCell()
      break
    case 'ArrowLeft':
      event.preventDefault()
      focusedCol.value = Math.max(0, focusedCol.value - 1)
      focusCurrentCell()
      break
    case 'Home':
      event.preventDefault()
      focusedCol.value = 0
      focusCurrentCell()
      break
    case 'End':
      event.preventDefault()
      focusedCol.value = colCount - 1
      focusCurrentCell()
      break
  }
}

function focusCurrentCell() {
  const tableEl = tableRef.value
  if (!tableEl) return
  const cell = tableEl.querySelector<HTMLElement>(
    `[data-grid-row="${focusedRow.value}"][data-grid-col="${focusedCol.value}"]`
  )
  cell?.focus()
}

function handleSort(col: DataTableColumn<T>) {
  if (!col.sortable) return

  if (sortBy.value === col.key) {
    if (sortOrder.value === 'asc') {
      sortOrder.value = 'desc'
    } else if (sortOrder.value === 'desc') {
      sortBy.value = null
      sortOrder.value = null
    } else {
      sortOrder.value = 'asc'
    }
  } else {
    sortBy.value = col.key
    sortOrder.value = 'asc'
  }

  emit('sort-change', col, sortOrder.value)
}

function handleCellCommit(
  item: T,
  col: DataTableColumn<T>,
  newValue: unknown,
  previousValue: unknown
) {
  ;(item as Record<string, unknown>)[col.key] = newValue

  if (editingCell.value && editingCell.value.columnKey === col.key) {
    editingCell.value = null
  }

  emit('cell-change', item, col.key, newValue, previousValue)
}

function getCellValue(item: T, key: string): unknown {
  return (item as Record<string, unknown>)[key]
}

function handleCellStartEdit(rowKey: string | number, columnKey: string) {
  editingCell.value = { rowKey, columnKey }
}

const sizePaddingClasses = computed(() => {
  switch (size) {
    case 'sm':
      return 'px-3 py-1.5 text-xs'
    case 'lg':
      return 'px-5 py-3.5 text-sm'
    case 'md':
    default:
      return 'px-4 py-2.5 text-xs'
  }
})

const headerPaddingClasses = computed(() => {
  switch (size) {
    case 'sm':
      return 'px-3 py-2 text-[11px]'
    case 'lg':
      return 'px-5 py-3.5 text-xs'
    case 'md':
    default:
      return 'px-4 py-2.5 text-xs'
  }
})

function getAlignClass(align?: 'left' | 'center' | 'right'): string {
  if (align === 'center') return 'text-center justify-center'
  if (align === 'right') return 'text-right justify-end'
  return 'text-left justify-start'
}

const baseLeftStickyOffset = computed(() => {
  let offset = 0
  if (selectable) offset += 40
  if (expandable) offset += 40
  return offset
})

const baseRightStickyOffset = computed(() => {
  return slots.actions ? 80 : 0
})

function getColumnLeftOffset(col: DataTableColumn<T>): string | undefined {
  if (col.pinned !== 'left') return undefined
  let left = baseLeftStickyOffset.value
  for (const c of visibleColumns.value) {
    if (c.key === col.key) break
    if (c.pinned === 'left') {
      const customWidth = columnSizingModel.value[c.key]
      const w =
        customWidth !== undefined ? customWidth : parsePixelValue(c.width || c.minWidth, 150)
      left += w
    }
  }
  return `${left}px`
}

function getColumnRightOffset(col: DataTableColumn<T>): string | undefined {
  if (col.pinned !== 'right') return undefined
  let right = baseRightStickyOffset.value
  const rev = [...visibleColumns.value].reverse()
  for (const c of rev) {
    if (c.key === col.key) break
    if (c.pinned === 'right') {
      const customWidth = columnSizingModel.value[c.key]
      const w =
        customWidth !== undefined ? customWidth : parsePixelValue(c.width || c.minWidth, 150)
      right += w
    }
  }
  return `${right}px`
}

function getPinnedHeaderClasses(pinned?: ColumnPinned): string {
  const bg = variant === 'glass' ? 'bg-bg-surface/90 backdrop-blur-xl' : 'bg-bg-base'
  if (pinned === 'left') {
    return cn(
      'sticky z-30 shadow-[4px_0_12px_-2px_rgba(0,0,0,0.06)] border-r border-border-default',
      bg
    )
  }
  if (pinned === 'right') {
    return cn(
      'sticky z-30 shadow-[-4px_0_12px_-2px_rgba(0,0,0,0.06)] border-l border-border-default',
      bg
    )
  }
  return ''
}

function getRowCellBackground(index: number = 0, isSelected: boolean = false): string {
  if (isSelected) {
    return '!bg-primary-subtle'
  }
  if (variant === 'striped' && index % 2 === 1) {
    return 'bg-bg-surface-active'
  }
  if (variant === 'glass') {
    return 'bg-bg-surface/90 backdrop-blur-xl'
  }
  return 'bg-bg-surface'
}

function getPinnedCellClasses(pinned?: ColumnPinned): string {
  if (pinned === 'left') {
    return 'sticky z-10 shadow-[4px_0_12px_-2px_rgba(0,0,0,0.06)] border-r border-border-default'
  }
  if (pinned === 'right') {
    return 'sticky z-10 shadow-[-4px_0_12px_-2px_rgba(0,0,0,0.06)] border-l border-border-default'
  }
  return ''
}

defineExpose({
  exportData,
  setColumnSize,
  resetColumnSizing,
  getColumnSize,
  selectRow,
  deselectAll,
  setGrouping,
  toggleGrouping,
  clearGrouping
})
</script>

<template>
  <div :class="cn(tableContainerVariants({ variant }), className)">
    <DataTableToolbar
      v-if="
        $slots.toolbar ||
        searchable ||
        enableColumnVisibility ||
        exportable ||
        refreshable ||
        groupingModel.length > 0 ||
        activeFiltersCount > 0
      "
      v-model:search-query="searchQuery"
      :variant="variant"
      :searchable="searchable"
      :search-placeholder="searchPlaceholder"
      :enable-column-visibility="enableColumnVisibility"
      :column-visibility-label="columnVisibilityLabel"
      :columns="normalizedColumns"
      :column-visibility="columnVisibilityModel"
      :grouping="groupingModel"
      :active-filters-count="activeFiltersCount"
      :exportable="exportable"
      :export-menu-items="exportMenuItems"
      :refreshable="refreshable"
      :loading="loading"
      :is-fetching="isFetching"
      :selected-count="selectedKeys.length"
      :total-count="effectiveTotalRows"
      :visible-columns="visibleColumns"
      @set-column-visibility="setColumnVisibility"
      @set-all-columns-visibility="setAllColumnsVisibility"
      @remove-grouping="removeGrouping"
      @clear-grouping="clearGrouping"
      @clear-filters="clearAllColumnFilters"
      @refresh="emit('refresh')"
    >
      <template v-if="$slots.toolbar" #toolbar="toolbarProps">
        <slot name="toolbar" v-bind="toolbarProps" />
      </template>
    </DataTableToolbar>
    <!-- Conteneur avec défilement horizontal & vertical fluide -->
    <div
      ref="scrollContainerRef"
      class="overflow-auto overscroll-contain w-full relative transition-opacity duration-200"
      :class="isFetching && !loading ? 'opacity-65' : ''"
      :style="virtual ? { maxHeight: virtualHeight } : undefined"
    >
      <!-- Indicateur flottant isFetching discret -->
      <div
        v-if="isFetching && !loading"
        class="absolute top-2 right-2 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-surface/90 backdrop-blur-md border border-border-default text-text-muted text-[11px] font-medium shadow-glass-xs animate-in fade-in"
      >
        <Spinner size="12px" class="text-primary" />
        <span>Mise à jour...</span>
      </div>
      <!-- Mode virtuel : Wrapper de hauteur totale -->
      <div :style="virtual ? { height: `${totalHeight}px`, position: 'relative' } : undefined">
        <table
          ref="tableRef"
          role="grid"
          :aria-rowcount="sourceData.length"
          :aria-colcount="totalColumnsCount"
          class="w-full border-separate border-spacing-0 text-text-primary text-left outline-none select-normal"
          :style="virtual ? { transform: `translateY(${offsetY}px)` } : undefined"
          tabindex="0"
          @keydown="handleGridKeyDown"
        >
          <!-- En-tête du tableau (Sticky CSS Natif Tailwind v4) -->
          <thead
            :class="
              cn(
                'select-none shadow-xs',
                variant === 'glass'
                  ? 'bg-bg-base/40 backdrop-blur-md'
                  : 'bg-bg-base/70 backdrop-blur-md',
                stickyHeader ? 'sticky top-0 z-20' : ''
              )
            "
          >
            <tr role="row">
              <!-- Case à cocher ou en-tête de Sélection -->
              <th
                v-if="selectable"
                scope="col"
                role="columnheader"
                :class="
                  cn(
                    'w-10 text-center shrink-0 sticky left-0 z-30 border-b border-border-default',
                    variant === 'glass' ? 'bg-bg-surface/90 backdrop-blur-xl' : 'bg-bg-base',
                    variant === 'bordered' && 'border-r border-border-default/60',
                    headerPaddingClasses
                  )
                "
              >
                <div class="flex items-center justify-center">
                  <Checkbox
                    v-if="selectionMode === 'multiple'"
                    :model-value="isAllSelected"
                    :indeterminate="isSomeSelected"
                    aria-label="Sélectionner toutes les lignes"
                    @update:model-value="toggleSelectAll"
                  />
                  <span v-else class="sr-only">Sélection</span>
                </div>
              </th>

              <!-- Colonne Chevron Tout Déplier / Déplier -->
              <th
                v-if="expandable"
                scope="col"
                role="columnheader"
                :class="
                  cn(
                    'w-10 text-center shrink-0 z-30 border-b border-border-default',
                    selectable ? 'sticky left-10' : 'sticky left-0',
                    variant === 'glass' ? 'bg-bg-surface/90 backdrop-blur-xl' : 'bg-bg-base',
                    variant === 'bordered' && 'border-r border-border-default/60',
                    headerPaddingClasses
                  )
                "
              >
                <div class="flex items-center justify-center">
                  <button
                    type="button"
                    :aria-label="isAllExpanded ? 'Tout replier' : 'Tout déplier'"
                    class="inline-flex items-center justify-center w-6 h-6 rounded text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                    @click="toggleAllExpansion()"
                  >
                    <Icon
                      name="chevron_right"
                      size="xs"
                      class="transition-transform duration-200"
                      :class="
                        isAllExpanded
                          ? 'rotate-90 text-primary'
                          : isSomeExpanded
                            ? 'rotate-45 text-primary'
                            : ''
                      "
                    />
                  </button>
                </div>
              </th>

              <!-- Colonnes de données -->
              <th
                v-for="col in visibleColumns"
                :key="col.key"
                scope="col"
                role="columnheader"
                :aria-sort="
                  sortBy === col.key
                    ? sortOrder === 'asc'
                      ? 'ascending'
                      : sortOrder === 'desc'
                        ? 'descending'
                        : 'none'
                    : undefined
                "
                :class="
                  cn(
                    'relative group/th font-bold tracking-wider uppercase text-text-muted text-[11px] transition-colors whitespace-nowrap border-b border-border-default',
                    variant === 'bordered' && 'border-r border-border-default/60 last:border-r-0',
                    headerPaddingClasses,
                    getAlignClass(col.align),
                    col.sortable &&
                      'cursor-pointer hover:text-text-primary hover:bg-bg-surface-hover/70',
                    getPinnedHeaderClasses(col.pinned),
                    col.headerClass
                  )
                "
                :style="getColumnWidthStyle(col)"
                @click="handleSort(col)"
              >
                <slot :name="`header-${col.key}`" :column="col">
                  <div
                    :class="
                      cn(
                        'flex items-center justify-between gap-1.5 w-full min-w-0',
                        getAlignClass(col.align)
                      )
                    "
                  >
                    <!-- Label de colonne + Indicateur de tri fluide -->
                    <div class="flex items-center gap-1 min-w-0 truncate">
                      <span class="truncate">{{ col.label }}</span>
                      <span
                        v-if="col.sortable"
                        class="inline-flex items-center justify-center shrink-0 transition-transform"
                        :class="
                          sortBy === col.key
                            ? 'text-primary font-black'
                            : 'text-text-muted/40 group-hover/th:text-text-secondary'
                        "
                      >
                        <Icon
                          v-if="sortBy === col.key"
                          :name="sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'"
                          size="xs"
                        />
                        <Icon v-else name="unfold_more" size="xs" />
                      </span>
                    </div>

                    <!-- Bouton de filtre micro-iconique fluide -->
                    <div
                      v-if="col.filterable"
                      class="inline-flex items-center shrink-0 ml-1"
                      @click.stop
                    >
                      <Popover width="sm" align="end">
                        <template #trigger>
                          <button
                            type="button"
                            :aria-label="`Filtrer par ${col.label}`"
                            class="relative inline-flex items-center justify-center w-5.5 h-5.5 rounded-md transition-all cursor-pointer"
                            :class="
                              isFilterActive(col.key)
                                ? 'text-primary bg-primary/20 border border-primary/40 font-bold shadow-xs'
                                : 'text-text-muted hover:text-text-primary hover:bg-bg-surface hover:border hover:border-border-default'
                            "
                          >
                            <Icon name="filter_alt" size="xs" />
                            <!-- Pastille badge actif -->
                            <span
                              v-if="isFilterActive(col.key)"
                              class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary ring-1 ring-bg-surface"
                            />
                          </button>
                        </template>

                        <div class="space-y-3 p-1">
                          <div
                            class="flex items-center justify-between pb-2 border-b border-border-default/60 pr-6"
                          >
                            <div
                              class="flex items-center gap-1.5 text-xs font-semibold text-text-primary"
                            >
                              <Icon name="filter_alt" size="xs" class="text-primary" />
                              <span>Filtre : {{ col.label }}</span>
                            </div>
                            <button
                              v-if="isFilterActive(col.key)"
                              type="button"
                              class="text-[11px] text-status-error hover:underline font-medium cursor-pointer"
                              @click="clearColumnFilter(col.key)"
                            >
                              Effacer
                            </button>
                          </div>

                          <!-- Contenu spécifique selon col.filterType -->
                          <slot
                            :name="`filter-${col.key}`"
                            :column="col"
                            :value="getColumnFilterValue(col.key)"
                            :set-value="(v: unknown) => setColumnFilterValue(col.key, v)"
                            :clear="() => clearColumnFilter(col.key)"
                          >
                            <!-- 1. Text filter -->
                            <div
                              v-if="col.filterType === 'text' || !col.filterType"
                              class="space-y-2"
                            >
                              <SearchInput
                                :model-value="String(getColumnFilterValue(col.key) ?? '')"
                                :placeholder="col.filterPlaceholder ?? `Filtrer ${col.label}...`"
                                size="sm"
                                class="w-full"
                                @update:model-value="
                                  (val: string) => setColumnFilterValue(col.key, val)
                                "
                              />
                            </div>

                            <!-- 2. Select filter -->
                            <div
                              v-else-if="col.filterType === 'select'"
                              class="space-y-1 max-h-48 overflow-y-auto"
                            >
                              <button
                                type="button"
                                class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                                :class="
                                  !isFilterActive(col.key)
                                    ? 'bg-primary/10 text-primary font-bold'
                                    : 'hover:bg-bg-surface-hover text-text-muted'
                                "
                                @click="clearColumnFilter(col.key)"
                              >
                                <span>Tous</span>
                                <Icon v-if="!isFilterActive(col.key)" name="check" size="xs" />
                              </button>
                              <button
                                v-for="opt in col.filterOptions ?? []"
                                :key="String(opt.value)"
                                type="button"
                                class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                                :class="
                                  getColumnFilterValue(col.key) === opt.value
                                    ? 'bg-primary/10 text-primary font-bold'
                                    : 'hover:bg-bg-surface-hover text-text-secondary'
                                "
                                @click="setColumnFilterValue(col.key, opt.value)"
                              >
                                <span class="truncate">{{ opt.label }}</span>
                                <Icon
                                  v-if="getColumnFilterValue(col.key) === opt.value"
                                  name="check"
                                  size="xs"
                                />
                              </button>
                            </div>

                            <!-- 3. Multi-Select filter -->
                            <div
                              v-else-if="col.filterType === 'multi-select'"
                              class="space-y-1 max-h-48 overflow-y-auto pr-1"
                            >
                              <label
                                v-for="opt in col.filterOptions ?? []"
                                :key="String(opt.value)"
                                class="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-bg-surface-hover/70 cursor-pointer transition-colors text-xs font-medium"
                              >
                                <Checkbox
                                  :model-value="
                                    Array.isArray(getColumnFilterValue(col.key)) &&
                                    (getColumnFilterValue(col.key) as any[]).includes(opt.value)
                                  "
                                  size="sm"
                                  @update:model-value="
                                    () => toggleMultiSelectFilter(col.key, opt.value)
                                  "
                                />
                                <span class="truncate">{{ opt.label }}</span>
                              </label>
                            </div>

                            <!-- 4. Boolean filter -->
                            <div
                              v-else-if="col.filterType === 'boolean'"
                              class="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-bg-surface-hover/50 border border-border-default/60"
                            >
                              <button
                                type="button"
                                class="py-1 text-xs rounded font-semibold transition-colors cursor-pointer"
                                :class="
                                  !isFilterActive(col.key)
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : 'text-text-muted hover:text-text-primary'
                                "
                                @click="clearColumnFilter(col.key)"
                              >
                                Tous
                              </button>
                              <button
                                type="button"
                                class="py-1 text-xs rounded font-semibold transition-colors cursor-pointer"
                                :class="
                                  getColumnFilterValue(col.key) === true
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : 'text-text-muted hover:text-text-primary'
                                "
                                @click="setColumnFilterValue(col.key, true)"
                              >
                                Oui
                              </button>
                              <button
                                type="button"
                                class="py-1 text-xs rounded font-semibold transition-colors cursor-pointer"
                                :class="
                                  getColumnFilterValue(col.key) === false
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : 'text-text-muted hover:text-text-primary'
                                "
                                @click="setColumnFilterValue(col.key, false)"
                              >
                                Non
                              </button>
                            </div>

                            <!-- 5. Number Range filter -->
                            <div
                              v-else-if="col.filterType === 'number-range'"
                              class="grid grid-cols-2 gap-2"
                            >
                              <div>
                                <label
                                  class="block text-[10px] text-text-muted uppercase font-bold mb-1"
                                  >Min</label
                                >
                                <input
                                  type="number"
                                  :value="(getColumnFilterValue(col.key) as any)?.min ?? ''"
                                  placeholder="Min"
                                  class="w-full px-2 py-1 text-xs rounded-lg border border-border-default bg-bg-surface outline-none focus:border-primary"
                                  @input="
                                    (e) =>
                                      setNumberRangeFilter(
                                        col.key,
                                        'min',
                                        (e.target as HTMLInputElement).value
                                      )
                                  "
                                />
                              </div>
                              <div>
                                <label
                                  class="block text-[10px] text-text-muted uppercase font-bold mb-1"
                                  >Max</label
                                >
                                <input
                                  type="number"
                                  :value="(getColumnFilterValue(col.key) as any)?.max ?? ''"
                                  placeholder="Max"
                                  class="w-full px-2 py-1 text-xs rounded-lg border border-border-default bg-bg-surface outline-none focus:border-primary"
                                  @input="
                                    (e) =>
                                      setNumberRangeFilter(
                                        col.key,
                                        'max',
                                        (e.target as HTMLInputElement).value
                                      )
                                  "
                                />
                              </div>
                            </div>
                          </slot>
                        </div>
                      </Popover>
                    </div>
                  </div>
                </slot>

                <!-- Poignée de redimensionnement de colonne (Resizer) -->
                <div
                  v-if="canResizeColumn(col)"
                  role="separator"
                  aria-orientation="vertical"
                  :aria-label="`Redimensionner la colonne ${col.label}`"
                  class="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize select-none touch-none hover:bg-primary/30 flex items-center justify-center transition-colors z-10"
                  :class="
                    resizingColumnKey === col.key
                      ? 'bg-primary/40 opacity-100'
                      : 'opacity-0 group-hover/th:opacity-100 hover:opacity-100'
                  "
                  @mousedown.stop.prevent="startColumnResize(col.key, $event)"
                  @touchstart.stop.prevent="startColumnResize(col.key, $event)"
                  @click.stop
                >
                  <div
                    class="w-[1.5px] h-3.5 rounded-full transition-colors"
                    :class="
                      resizingColumnKey === col.key
                        ? 'bg-primary'
                        : 'bg-border-default/90 group-hover/th:bg-primary'
                    "
                  />
                </div>
              </th>

              <!-- Colonne Actions optionnelle -->
              <th
                v-if="$slots.actions"
                scope="col"
                role="columnheader"
                :class="
                  cn(
                    'w-20 text-right shrink-0 font-bold uppercase tracking-wider text-text-muted text-[11px] sticky right-0 z-30 shadow-[-4px_0_12px_-2px_rgba(0,0,0,0.06)] border-l border-b border-border-default',
                    variant === 'glass' ? 'bg-bg-surface/90 backdrop-blur-xl' : 'bg-bg-base',
                    headerPaddingClasses
                  )
                "
              >
                Actions
              </th>
            </tr>
          </thead>

          <!-- Corps du tableau -->
          <tbody>
            <!-- 1. État de Chargement (Skeletons) tout en conservant les en-têtes -->
            <template v-if="loading">
              <tr v-for="r in loadingRows" :key="`skeleton-${r}`" role="row" class="animate-pulse">
                <td
                  v-if="selectable"
                  class="p-3 text-center sticky left-0 z-10 bg-bg-surface/95 border-b border-border-default"
                >
                  <Skeleton variant="rounded" width="18px" height="18px" class="mx-auto" />
                </td>
                <td
                  v-if="expandable"
                  :class="
                    cn(
                      'p-3 text-center z-10 bg-bg-surface/95 border-b border-border-default',
                      selectable ? 'sticky left-10' : 'sticky left-0'
                    )
                  "
                >
                  <Skeleton variant="rounded" width="16px" height="16px" class="mx-auto" />
                </td>
                <td
                  v-for="col in visibleColumns"
                  :key="`skeleton-col-${col.key}`"
                  :class="
                    cn(
                      sizePaddingClasses,
                      'border-b border-border-default',
                      getPinnedCellClasses(col.pinned)
                    )
                  "
                  :style="getColumnWidthStyle(col)"
                >
                  <Skeleton variant="text" :width="col.width ? '70%' : '85%'" height="14px" />
                </td>
                <td
                  v-if="$slots.actions"
                  class="p-3 text-right sticky right-0 z-10 bg-bg-surface/95 border-b border-l border-border-default"
                >
                  <Skeleton variant="rounded" width="28px" height="28px" class="ml-auto" />
                </td>
              </tr>
            </template>

            <!-- 2. État d'Erreur Réseau / Serveur -->
            <tr v-else-if="isError" role="row">
              <td role="gridcell" :colspan="totalColumnsCount" class="py-12 text-center">
                <slot name="error" :error-text="errorText">
                  <div class="flex flex-col items-center justify-center gap-3 text-center px-4">
                    <div
                      class="w-11 h-11 rounded-2xl bg-status-error/15 text-status-error flex items-center justify-center shadow-glass-xs"
                    >
                      <Icon name="error" size="md" />
                    </div>
                    <div class="space-y-1">
                      <h4 class="text-sm font-bold text-text-primary">Erreur de chargement</h4>
                      <p class="text-xs text-text-muted max-w-sm">{{ errorText }}</p>
                    </div>
                    <Button
                      v-if="refreshable"
                      variant="secondary"
                      size="sm"
                      class="mt-1 flex items-center gap-1.5 text-xs font-semibold"
                      @click="emit('refresh')"
                    >
                      <Icon name="refresh" size="xs" />
                      <span>Réessayer</span>
                    </Button>
                  </div>
                </slot>
              </td>
            </tr>

            <!-- 3. Données réelles / virtuelles -->
            <template v-else-if="displayRows.length > 0">
              <template v-for="{ row, index } in displayRows" :key="row.id ?? `row-${index}`">
                <!-- 3.A Ligne de Groupe (Group Header Row) -->
                <tr
                  v-if="row.getIsGrouped && row.getIsGrouped()"
                  role="row"
                  class="bg-bg-base/70 font-semibold border-b border-border-default hover:bg-bg-base transition-colors cursor-pointer select-none"
                  @click="row.toggleExpanded()"
                >
                  <td role="gridcell" :colspan="totalColumnsCount" class="py-2.5 px-4">
                    <slot
                      name="group-header"
                      :row="row"
                      :group-key="row.groupingColumnId"
                      :group-value="row.groupingValue"
                      :count="row.getLeafRows ? row.getLeafRows().length : row.subRows.length"
                      :is-expanded="row.getIsExpanded()"
                      :toggle-expand="() => row.toggleExpanded()"
                    >
                      <div class="flex items-center justify-between gap-3 flex-wrap">
                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            :aria-label="
                              row.getIsExpanded() ? 'Replier le groupe' : 'Déplier le groupe'
                            "
                            class="inline-flex items-center justify-center w-6 h-6 rounded text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                            @click.stop="row.toggleExpanded()"
                          >
                            <Icon
                              name="chevron_right"
                              size="xs"
                              class="transition-transform duration-200"
                              :class="row.getIsExpanded() ? 'rotate-90 text-primary' : ''"
                            />
                          </button>
                          <span class="text-xs text-text-muted uppercase tracking-wider font-bold">
                            {{ getColumnLabel(row.groupingColumnId) }} :
                          </span>
                          <span
                            class="text-xs font-bold text-text-primary px-2 py-0.5 rounded-md bg-bg-surface border border-border-default shadow-xs"
                          >
                            {{ row.groupingValue ?? '(Vide)' }}
                          </span>
                          <span class="text-[11px] text-text-muted font-normal">
                            ({{
                              row.getLeafRows ? row.getLeafRows().length : row.subRows.length
                            }}
                            élément{{
                              (row.getLeafRows ? row.getLeafRows().length : row.subRows.length) > 1
                                ? 's'
                                : ''
                            }})
                          </span>
                        </div>

                        <div
                          class="flex items-center gap-4 text-xs font-medium text-text-muted ml-auto pr-2"
                        >
                          <template v-for="c in visibleColumns" :key="`agg-${c.key}`">
                            <div
                              v-if="c.aggregation"
                              class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-bg-surface/80 border border-border-subtle/50 text-[11px]"
                            >
                              <span class="text-text-muted"
                                >{{ c.aggregationLabel ?? c.label }} :</span
                              >
                              <span class="font-bold text-text-primary">{{
                                computeGroupAggregation(c, row)
                              }}</span>
                            </div>
                          </template>
                        </div>
                      </div>
                    </slot>
                  </td>
                </tr>

                <!-- 3.B Ligne de données classique (Leaf Data Row) -->
                <template v-else>
                  <tr
                    role="row"
                    :aria-selected="isRowSelected(row.original, index)"
                    :class="
                      cn(
                        'group/row transition-colors duration-150',
                        variant === 'striped' && index % 2 === 1
                          ? 'bg-bg-surface-active'
                          : variant === 'glass'
                            ? 'bg-bg-surface/30 backdrop-blur-sm'
                            : 'bg-bg-surface',
                        (hoverable || selectOnClickRow) &&
                          'hover:bg-bg-surface-hover cursor-pointer',
                        isRowSelected(row.original, index) && '!bg-primary-subtle font-medium',
                        isRowExpanded(row.original, index) && 'bg-bg-surface-hover/40'
                      )
                    "
                    :style="virtual ? { height: `${rowHeight}px` } : undefined"
                    @click="handleRowClick(row.original, index)"
                  >
                    <!-- Case à cocher ou Radio de sélection -->
                    <td
                      v-if="selectable"
                      role="gridcell"
                      :data-grid-row="index"
                      :data-grid-col="0"
                      :tabindex="focusedRow === index && focusedCol === 0 ? 0 : -1"
                      :class="
                        cn(
                          'w-10 text-center shrink-0 sticky left-0 z-10 outline-none focus:ring-1 focus:ring-primary border-b border-border-default/70',
                          variant === 'bordered' && 'border-r border-border-default/60',
                          getRowCellBackground(index, isRowSelected(row.original, index)),
                          sizePaddingClasses
                        )
                      "
                      @click.stop
                    >
                      <div class="flex items-center justify-center">
                        <Checkbox
                          v-if="selectionMode === 'multiple'"
                          :model-value="isRowSelected(row.original, index)"
                          :aria-label="`Sélectionner la ligne ${index + 1}`"
                          @update:model-value="toggleRowSelection(row.original, index)"
                        />
                        <div
                          v-else
                          role="radio"
                          :aria-checked="isRowSelected(row.original, index)"
                          :aria-label="`Sélectionner la ligne ${index + 1}`"
                          tabindex="0"
                          class="relative inline-flex items-center justify-center w-4.5 h-4.5 rounded-full border transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 touch-manipulation"
                          :class="
                            isRowSelected(row.original, index)
                              ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                              : 'border-border-default hover:border-primary/60 bg-bg-surface/50'
                          "
                          @click="toggleRowSelection(row.original, index)"
                          @keydown.space.prevent="toggleRowSelection(row.original, index)"
                          @keydown.enter.prevent="toggleRowSelection(row.original, index)"
                        >
                          <span
                            v-if="isRowSelected(row.original, index)"
                            class="w-2 h-2 rounded-full bg-primary-foreground"
                          />
                        </div>
                      </div>
                    </td>

                    <!-- Bouton chevron d'expansion -->
                    <td
                      v-if="expandable"
                      role="gridcell"
                      :data-grid-row="index"
                      :data-grid-col="selectable ? 1 : 0"
                      :tabindex="
                        focusedRow === index && focusedCol === (selectable ? 1 : 0) ? 0 : -1
                      "
                      :class="
                        cn(
                          'w-10 text-center shrink-0 outline-none focus:ring-1 focus:ring-primary border-b border-border-default/70',
                          variant === 'bordered' && 'border-r border-border-default/60',
                          selectable ? 'sticky left-10 z-10' : 'sticky left-0 z-10',
                          getRowCellBackground(index, isRowSelected(row.original, index)),
                          sizePaddingClasses
                        )
                      "
                      @click.stop
                    >
                      <button
                        v-if="canItemExpand(row.original, index)"
                        type="button"
                        :aria-expanded="isRowExpanded(row.original, index)"
                        :aria-label="
                          isRowExpanded(row.original, index)
                            ? 'Replier la ligne'
                            : 'Déplier la ligne'
                        "
                        class="inline-flex items-center justify-center w-7 h-7 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface-hover transition-colors touch-manipulation cursor-pointer"
                        @click="toggleRowExpansion(row.original, index)"
                      >
                        <Icon
                          name="chevron_right"
                          size="xs"
                          class="transition-transform duration-200"
                          :class="
                            isRowExpanded(row.original, index) ? 'rotate-90 text-primary' : ''
                          "
                        />
                      </button>
                    </td>

                    <!-- Cellules de données avec DataTableCell (Isolation locale) -->
                    <td
                      v-for="(col, cIndex) in visibleColumns"
                      :key="col.key"
                      role="gridcell"
                      :data-grid-row="index"
                      :data-grid-col="gridColOffset + cIndex"
                      :tabindex="
                        focusedRow === index && focusedCol === gridColOffset + cIndex ? 0 : -1
                      "
                      :class="
                        cn(
                          'align-middle min-w-0 outline-none focus:ring-1 focus:ring-primary rounded-xs border-b border-border-default/70',
                          variant === 'bordered' &&
                            'border-r border-border-default/60 last:border-r-0',
                          getRowCellBackground(index, isRowSelected(row.original, index)),
                          sizePaddingClasses,
                          getAlignClass(col.align),
                          getPinnedCellClasses(col.pinned),
                          col.class
                        )
                      "
                      :style="getColumnWidthStyle(col)"
                    >
                      <DataTableCell
                        :value="getCellValue(row.original, col.key)"
                        :item="row.original"
                        :column-key="col.key"
                        :column-label="col.label"
                        :editable="col.editable"
                        :edit-type="col.editType"
                        :options="col.editOptions"
                        :formatter="col.formatter"
                        :align="col.align"
                        :size="size"
                        @commit="
                          (newVal, oldVal) => handleCellCommit(row.original, col, newVal, oldVal)
                        "
                        @start-edit="handleCellStartEdit(getItemKey(row.original, index), col.key)"
                      >
                        <!-- Relayage du slot de cellule personnalisé -->
                        <template #cell="cellScope">
                          <slot
                            :name="`cell-${col.key}`"
                            v-bind="cellScope"
                            :column="col"
                            :index="index"
                          >
                            <slot name="cell" v-bind="cellScope" :column="col" :index="index">
                              <div
                                class="truncate block min-w-0 text-xs text-text-primary"
                                :title="
                                  String(
                                    col.formatter
                                      ? col.formatter(
                                          getCellValue(row.original, col.key),
                                          row.original
                                        )
                                      : (getCellValue(row.original, col.key) ?? '-')
                                  )
                                "
                              >
                                {{
                                  col.formatter
                                    ? col.formatter(
                                        getCellValue(row.original, col.key),
                                        row.original
                                      )
                                    : (getCellValue(row.original, col.key) ?? '-')
                                }}
                              </div>
                            </slot>
                          </slot>
                        </template>

                        <!-- Relayage du slot d'éditeur personnalisé -->
                        <template #editor="editorScope">
                          <slot
                            :name="`editor-${col.key}`"
                            v-bind="editorScope"
                            :column="col"
                            :index="index"
                          />
                        </template>
                      </DataTableCell>
                    </td>

                    <!-- Actions de ligne optionnelles -->
                    <td
                      v-if="$slots.actions"
                      role="gridcell"
                      :data-grid-row="index"
                      :data-grid-col="gridColOffset + visibleColumns.length"
                      :tabindex="
                        focusedRow === index && focusedCol === gridColOffset + visibleColumns.length
                          ? 0
                          : -1
                      "
                      :class="
                        cn(
                          'w-20 text-right sticky right-0 z-10 shadow-[-4px_0_12px_-2px_rgba(0,0,0,0.06)] outline-none focus:ring-1 focus:ring-primary border-l border-b border-border-default/70',
                          getRowCellBackground(index, isRowSelected(row.original, index)),
                          sizePaddingClasses
                        )
                      "
                    >
                      <slot name="actions" :item="row.original" :index="index" />
                    </td>
                  </tr>

                  <!-- Ligne enfant de détails étirables (Master-Detail) -->
                  <tr
                    v-if="expandable && isRowExpanded(row.original, index)"
                    role="row"
                    class="bg-bg-base/40 transition-colors animate-in fade-in"
                  >
                    <td
                      role="gridcell"
                      :colspan="totalColumnsCount"
                      class="p-4 bg-bg-base/40 border-b border-border-default border-l-2 border-l-primary shadow-inner"
                    >
                      <slot
                        name="expanded-row"
                        :item="row.original"
                        :index="index"
                        :is-expanded="isRowExpanded(row.original, index)"
                        :toggle-expand="() => toggleRowExpansion(row.original, index)"
                      />
                    </td>
                  </tr>
                </template>
              </template>
            </template>

            <!-- 4. État Vide -->
            <tr v-else role="row">
              <td role="gridcell" :colspan="totalColumnsCount" class="py-12 text-center">
                <slot name="empty">
                  <EmptyState
                    title="Aucune donnée"
                    :description="emptyText"
                    class="bg-transparent border-0 shadow-none py-4"
                  />
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Barre de pagination intégrée en pied de tableau -->
    <div
      v-if="pagination && effectiveTotalRows > 0"
      :class="
        cn(
          'px-4 py-3 border-t border-border-default flex items-center justify-between gap-3 flex-wrap',
          variant === 'glass' ? 'bg-bg-surface/40 backdrop-blur-md' : 'bg-bg-surface'
        )
      "
    >
      <slot
        name="pagination"
        :page="pageModel"
        :page-size="pageSizeModel"
        :total="effectiveTotalRows"
        :page-count="pageCount ?? table.getPageCount()"
      >
        <Pagination
          v-model:page="pageModel"
          v-model:items-per-page="pageSizeModel"
          :total="effectiveTotalRows"
          :page-size-options="pageSizeOptions"
          :show-summary="showPaginationSummary"
          :show-page-size-select="showPageSizeSelect"
          :variant="paginationVariant"
          :size="paginationSize"
          class="w-full justify-between"
          @update:page="emit('page-change', pageModel, pageSizeModel)"
          @update:items-per-page="emit('page-change', pageModel, pageSizeModel)"
        />
      </slot>
    </div>

    <!-- Pied de tableau / Footer optionnel -->
    <div
      v-if="$slots.footer"
      :class="
        cn(
          'px-4 py-3 border-t border-border-default flex items-center justify-between gap-3 flex-wrap text-xs text-text-muted',
          variant === 'glass' ? 'bg-bg-surface/40 backdrop-blur-md' : 'bg-bg-surface'
        )
      "
    >
      <slot
        name="footer"
        :total="effectiveTotalRows"
        :selected-count="selectedKeys.length"
        :sort-by="sortBy"
        :sort-order="sortOrder"
      />
    </div>
  </div>
</template>
