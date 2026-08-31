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
})
