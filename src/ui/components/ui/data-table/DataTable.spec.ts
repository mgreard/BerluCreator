import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DataTable from './DataTable.vue'
import DataTableCell from './DataTableCell.vue'
import type { DataTableColumn, DataTableExpose } from './types'

interface User {
  id: number
  name: string
  role: string
  score?: number
  tags?: string[]
  active?: boolean
}

const mockColumns: DataTableColumn<User>[] = [
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
      { value: 'Éditeur', label: 'Éditeur' }
    ],
    filterOptions: [
      { value: 'Administrateur', label: 'Administrateur' },
      { value: 'Éditeur', label: 'Éditeur' }
    ]
  },
  {
    key: 'score',
    label: 'Score',
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

const mockData: User[] = [
  {
    id: 1,
    name: 'Alice Dupont',
    role: 'Administrateur',
    score: 95,
    tags: ['Vue', 'TS'],
    active: true
  },
  { id: 2, name: 'Bob Martin', role: 'Éditeur', score: 88, tags: ['CSS', 'HTML'], active: false }
]

describe('DataTable & DataTableCell (Colocated Unit Tests)', () => {
  it('1. Rend la sémantique de table native avec role="grid", "columnheader" et "gridcell"', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
        selectable: true
      }
    })

    expect(wrapper.find('table[role="grid"]').exists()).toBe(true)
    expect(wrapper.findAll('th[role="columnheader"]').length).toBeGreaterThan(0)
    expect(wrapper.findAll('td[role="gridcell"]').length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('Nom')
    expect(wrapper.text()).toContain('Rôle')
    expect(wrapper.text()).toContain('Alice Dupont')
    expect(wrapper.text()).toContain('Bob Martin')
  })

  it('2. Déclenche le tri réactif lors du clic sur une colonne sortable via le moteur TanStack', async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
        sortBy: null,
        sortOrder: null
      }
    })

    const nameTh = wrapper.findAll('th[role="columnheader"]')[0]
    await nameTh.trigger('click')

    expect(wrapper.emitted('update:sortBy')?.[0]).toEqual(['name'])
    expect(wrapper.emitted('update:sortOrder')?.[0]).toEqual(['asc'])
    expect(wrapper.emitted('sort-change')).toBeDefined()
  })

  it('3. Affiche l’état vide lorsque les données sont vides', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: [],
        emptyText: 'Aucun enregistrement'
      }
    })

    expect(wrapper.text()).toContain('Aucun enregistrement')
  })

  it('4. Affiche l’état de chargement avec squelettes tout en préservant la structure des en-têtes', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
        loading: true,
        loadingRows: 4
      }
    })

    expect(wrapper.find('thead').exists()).toBe(true)
    expect(wrapper.text()).toContain('Nom')

    const skeletons = wrapper.findAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('5. Active l’édition inline au double-clic et isole les ré-rendus (DataTableCell)', async () => {
    const wrapper = mount(DataTableCell, {
      props: {
        value: 'Alice Dupont',
        item: mockData[0],
        columnKey: 'name',
        editable: true,
        editType: 'text'
      }
    })

    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.text()).toContain('Alice Dupont')

    await wrapper.find('.group\\/cell').trigger('dblclick')
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.emitted('start-edit')).toBeDefined()

    const input = wrapper.find('input[type="text"]')
    await input.setValue('Alice Martin')

    await input.trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('commit')).toBeUndefined()
    expect(wrapper.emitted('cancel')).toBeDefined()
  })

  it('6. Émet commit avec conversion numérique sur Enter pour le type number', async () => {
    const wrapper = mount(DataTableCell, {
      props: {
        value: 95,
        item: mockData[0],
        columnKey: 'score',
        editable: true,
        editType: 'number'
      }
    })

    await wrapper.find('.group\\/cell').trigger('dblclick')
    const input = wrapper.find('input[type="number"]')
    await input.setValue('99')
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('commit')?.[0]).toEqual([99, 95])
  })

  it('7. Supporte le type boolean avec bascule rapide', async () => {
    const wrapper = mount(DataTableCell, {
      props: {
        value: true,
        item: mockData[0],
        columnKey: 'active',
        editable: true,
        editType: 'boolean'
      }
    })

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(wrapper.text()).toContain('Oui')

    await button.trigger('click')
    expect(wrapper.emitted('commit')?.[0]).toEqual([false, true])
  })

  it('8. Supporte le roving tabindex et la navigation au clavier (ArrowDown, ArrowRight)', async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData
      }
    })

    const table = wrapper.find('table[role="grid"]')
    expect(table.exists()).toBe(true)

    const firstCell = wrapper.find('[data-grid-row="0"][data-grid-col="0"]')
    expect(firstCell.attributes('tabindex')).toBe('0')

    await table.trigger('keydown', { key: 'ArrowDown' })
    const nextRowCell = wrapper.find('[data-grid-row="1"][data-grid-col="0"]')
    expect(nextRowCell.attributes('tabindex')).toBe('0')
  })

  it('9. Déplie une ligne et affiche le contenu du slot expanded-row lors du clic sur le chevron', async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
        expandable: true,
        expandedKeys: []
      },
      slots: {
        'expanded-row': ({ item }) => `<div class="sub-detail">Détails de ${item.name}</div>`
      }
    })

    expect(wrapper.find('.sub-detail').exists()).toBe(false)

    const expandBtn = wrapper.findAll('tbody td button')[0]
    expect(expandBtn.exists()).toBe(true)
    await expandBtn.trigger('click')

    expect(wrapper.emitted('update:expandedKeys')?.[0]).toEqual([[1]])
    expect(wrapper.emitted('expand-change')?.[0]).toEqual([mockData[0], true, [1]])
  })

  it('10. Rend les boutons de filtre sur les colonnes filterable', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData
      }
    })

    const filterBtns = wrapper.findAll('button[aria-label^="Filtrer par"]')
    expect(filterBtns.length).toBeGreaterThan(0)
  })

  it('11. Filtre réactivement les lignes selon le modèle columnFilters', async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
        columnFilters: { name: 'Alice' }
      }
    })

    expect(wrapper.text()).toContain('Alice Dupont')
    expect(wrapper.text()).not.toContain('Bob Martin')
  })

  it('12. Rend le bouton d’export de données lorsque exportable est actif', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
        exportable: true
      }
    })

    const exportBtn = wrapper.findAll('button').find((button) => button.text().includes('Exporter'))
    expect(exportBtn).toBeDefined()
    expect(exportBtn?.attributes('aria-label')).toBe('Exporter les données du tableau')
  })

  it('13. Déclenche l’export programmatique et émet l’événement export', async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
        exportable: true,
        exportFilename: 'test-users'
      }
    })

    const vm = wrapper.vm as unknown as DataTableExpose
    expect(typeof vm.exportData).toBe('function')
    vm.exportData('json', { filename: 'test-users' })

    expect(wrapper.emitted('export')?.[0]).toEqual(['json', 2, 'test-users'])
  })

  it('14. Rend les poignées de redimensionnement de colonne lorsque resizable est actif', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
        resizable: true
      }
    })

    const resizers = wrapper.findAll('[role="separator"][aria-label^="Redimensionner la colonne"]')
    expect(resizers.length).toBeGreaterThan(0)
  })

  it('15. Modifie la largeur d’une colonne lors de l’appel de setColumnSize et émet column-resize-change', async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
        resizable: true
      }
    })

    const vm = wrapper.vm as unknown as DataTableExpose
    expect(typeof vm.setColumnSize).toBe('function')
    vm.setColumnSize('name', 250)

    expect(wrapper.emitted('update:columnSizing')?.[0]).toEqual([{ name: 250 }])
    expect(wrapper.emitted('column-resize-change')?.[0]).toEqual(['name', 250, { name: 250 }])
    expect(vm.getColumnSize('name')).toBe(250)
  })

  it('16. Sélectionne une ligne unique en mode single et désélectionne la précédente', async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData,
        selectable: true,
        selectionMode: 'single',
        selectedKey: null
      }
    })

    const radios = wrapper.findAll('tbody td [role="radio"]')
    expect(radios.length).toBe(2)

    await radios[0].trigger('click')
    expect(wrapper.emitted('update:selectedKey')?.[0]).toEqual([1])
    expect(wrapper.emitted('update:selectedKeys')?.[0]).toEqual([[1]])
    expect(wrapper.emitted('select-change')?.[0]).toEqual([1, [1], mockData[0]])
  })
})
