import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/components/ui/dropdown-menu'
import WorkspaceBackupMenu from './WorkspaceBackupMenu.vue'

vi.mock('../composables/useWorkspaceBackupActions', () => ({
  useWorkspaceBackupActions: () => ({
    status: ref('dirty'),
    snapshotSummary: ref(null),
    isBusy: ref(false),
    isResetConfirmOpen: ref(false),
    isResetting: ref(false),
    saveSnapshot: vi.fn(),
    exportSnapshotFile: vi.fn(),
    importSnapshotFile: vi.fn(),
    restoreSnapshot: vi.fn(),
    resetApplication: vi.fn()
  })
}))

describe('WorkspaceBackupMenu', () => {
  it('adapte le menu et son trigger au header', () => {
    const wrapper = mount(WorkspaceBackupMenu, { props: { placement: 'header' } })

    expect(wrapper.getComponent(DropdownMenu).props('side')).toBe('bottom')
    expect(wrapper.getComponent(Button).props('size')).toBe('xs')
    expect(wrapper.text()).toContain('Projet')
  })

  it('propose Export HD dans les items et émet openBatchExport au clic', () => {
    const wrapper = mount(WorkspaceBackupMenu, { props: { placement: 'header' } })

    const dropdown = wrapper.getComponent(DropdownMenu)
    const items = dropdown.props('items') as Array<{ id?: string; label?: string; onClick?: () => void }>
    const batchExportItem = items.find((item) => item.id === 'batch-export')

    expect(batchExportItem).toBeDefined()
    expect(batchExportItem?.label).toBe('Export HD')

    batchExportItem?.onClick?.()
    expect(wrapper.emitted('openBatchExport')).toHaveLength(1)
  })
})
