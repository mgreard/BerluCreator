import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ViewportSnapshotsPanel from './ViewportSnapshotsPanel.vue'

const mocks = vi.hoisted(() => {
  const snapshot = {
    id: 'snapshot-1',
    name: 'Journal de 20 heures',
    thumbnailDataUrl: 'data:image/png;base64,preview',
    camera: { enabled: true, x: 0, y: 0, width: 1792, height: 1024, aspectRatio: '16:9' },
    groups: [],
    layers: [{ id: 'layer-1' }, { id: 'layer-2' }],
    createdAt: new Date('2026-08-28T11:50:00').getTime(),
    updatedAt: new Date('2026-08-28T11:50:00').getTime()
  }

  return {
    snapshot,
    loadSnapshots: vi.fn(async () => [snapshot]),
    deleteSnapshot: vi.fn(async () => undefined),
    createSnapshot: vi.fn(),
    applyViewportSnapshot: vi.fn(() => 2),
    endGesture: vi.fn()
  }
})

vi.mock('../../stores/useViewportSnapshotStore', () => ({
  useViewportSnapshotStore: () => ({
    snapshots: [mocks.snapshot],
    isLoading: false,
    loadSnapshots: mocks.loadSnapshots,
    deleteSnapshot: mocks.deleteSnapshot,
    createSnapshot: mocks.createSnapshot
  })
}))

vi.mock('../../stores/useEditorStore', () => ({
  useEditorStore: () => ({
    currentDocument: { layers: [], groups: [] },
    applyViewportSnapshot: mocks.applyViewportSnapshot,
    endGesture: mocks.endGesture
  })
}))

vi.mock('@/features/project/stores/useProjectStore', () => ({
  useProjectStore: () => ({ currentProject: { stage: { width: 1792, height: 1024 } } })
}))

vi.mock('@/features/studio/composables/useHierarchyResolver', () => ({
  useHierarchyResolver: () => ({ activeLayers: [] })
}))

vi.mock('@/features/studio/composables/useCanvasRenderer', () => ({
  captureCleanFrame: vi.fn(async () => 'data:image/png;base64,capture')
}))

vi.mock('@/ui/shared/services/toast.service', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}))

describe('ViewportSnapshotsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  it('rend une ligne compacte et charge le snapshot sans refermer le panneau', async () => {
    const wrapper = mount(ViewportSnapshotsPanel, { props: { open: true } })
    await flushPromises()

    const row = wrapper.get('article')
    expect(row.text()).toContain('Journal de 20 heures')
    expect(row.text()).toContain('2 calque(s)')
    expect(row.get('img').attributes('src')).toBe('data:image/png;base64,preview')

    await row.get('button').trigger('click')

    expect(mocks.applyViewportSnapshot).toHaveBeenCalledWith(mocks.snapshot)
    expect(wrapper.emitted('update:open')).toBeUndefined()
  })

  it('replie le panneau lors du clic sur le bouton de fermeture', async () => {
    const wrapper = mount(ViewportSnapshotsPanel, { props: { open: true } })
    await flushPromises()

    await wrapper.get('button[aria-label="Replier le panneau des compositions"]').trigger('click')
    expect(wrapper.emitted('update:open')).toContainEqual([false])
  })

  it('conserve la suppression confirmée depuis la liste', async () => {
    const wrapper = mount(ViewportSnapshotsPanel, { props: { open: true } })
    await flushPromises()

    await wrapper.get('button[aria-label="Supprimer Journal de 20 heures"]').trigger('click')
    await flushPromises()

    expect(confirm).toHaveBeenCalled()
    expect(mocks.deleteSnapshot).toHaveBeenCalledWith('snapshot-1')
  })
})
