<script setup lang="ts">
import { ref } from 'vue'
import DataTable from './DataTable.vue'
import type { DataTableColumn, DataTableProps } from './types'

interface User {
  id: number
  name: string
  role: string
  score: number
  tags: string[]
  active: boolean
}

const columns: DataTableColumn<User>[] = [
  {
    key: 'name',
    label: 'Nom',
    sortable: true,
    filterable: true,
    filterType: 'text',
    pinned: 'left'
  },
  {
    key: 'role',
    label: 'Rôle',
    sortable: true,
    filterable: true,
    filterType: 'select',
    editable: true,
    editType: 'select',
    editOptions: [
      { value: 'Administrateur', label: 'Administrateur' },
      { value: 'Éditeur', label: 'Éditeur' },
      { value: 'Développeur', label: 'Développeur' }
    ],
    filterOptions: [
      { value: 'Administrateur', label: 'Administrateur' },
      { value: 'Éditeur', label: 'Éditeur' },
      { value: 'Développeur', label: 'Développeur' }
    ]
  },
  {
    key: 'score',
    label: 'Score',
    sortable: true,
    filterable: true,
    filterType: 'number-range',
    editable: true,
    editType: 'number'
  },
  { key: 'tags', label: 'Compétences', editable: true, editType: 'tags' },
  {
    key: 'active',
    label: 'Actif',
    filterable: true,
    filterType: 'boolean',
    editable: true,
    editType: 'boolean'
  }
]

const data: User[] = [
  {
    id: 1,
    name: 'Alice Dupont',
    role: 'Administrateur',
    score: 95,
    tags: ['Vue 3.5', 'TypeScript'],
    active: true
  },
  {
    id: 2,
    name: 'Bob Martin',
    role: 'Éditeur',
    score: 88,
    tags: ['Tailwind', 'CSS'],
    active: false
  },
  {
    id: 3,
    name: 'Charlie Durand',
    role: 'Développeur',
    score: 92,
    tags: ['Reka UI', 'Vitest'],
    active: true
  }
]

const state = ref<DataTableProps<User>>({
  columns,
  data,
  selectable: true,
  searchable: true,
  enableColumnVisibility: true,
  resizable: true,
  pagination: true,
  exportable: true,
  variant: 'default'
})
</script>

<template>
  <Story title="Data Display/DataTable" :layout="{ type: 'single' }">
    <Variant title="Interactive Super DataTable">
      <div class="p-6 bg-bg-surface border border-border-default rounded-2xl max-w-5xl mx-auto">
        <DataTable v-bind="state" />
      </div>
    </Variant>
  </Story>
</template>
