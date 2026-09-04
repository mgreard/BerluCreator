import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ViewportQuicksaveButton from './ViewportQuicksaveButton.vue'

const mocks = vi.hoisted(() => {
  const snapshot = {
    id: 'snap-1',
    name: 'Keyframe 12:00:00',
    thumbnailDataUrl: 'data:image/png;base64,capture',
    camera: { enabled: false, x: 0, y: 0, width: 1792, height: 1024, aspectRatio: '16:9' },
    groups: [],
    layers: [],
    createdAt: 1000,
    updatedAt: 1000
  }

  return {
    snapshot,
    createSnapshot: vi.fn(async () => snapshot),
    endGesture: vi.fn(),
    captureCleanFrame: vi.fn(async () => 'data:image/png;base64,capture'),
    toastSuccess: vi.fn(),
    toastError: vi.fn()
  }
})

vi.mock('@/features/editor/stores/useViewportSnapshotStore', () => ({
  useViewportSnapshotStore: () => ({
    createSnapshot: mocks.createSnapshot
  })
}))

vi.mock('@/features/editor/stores/useEditorStore', () => ({
  useEditorStore: () => ({
    currentDocument: {
      depthOfField: { enabled: false },
      colorGrading: { enabled: false },
      shaderSettings: { enabled: false },
      layers: [],
      groups: []
    },
    endGesture: mocks.endGesture
  })
}))

vi.mock('@/features/project/stores/useProjectStore', () => ({
  useProjectStore: () => ({
    currentProject: { stage: { width: 1792, height: 1024 } }
  })
}))

vi.mock('@/features/studio/composables/useHierarchyResolver', () => ({
  useHierarchyResolver: () => ({
    activeLayers: []
  })
}))

vi.mock('@/features/studio/composables/useCanvasRenderer', () => ({
  captureCleanFrame: () => mocks.captureCleanFrame()
}))

vi.mock('@/ui/shared/services/toast.service', () => ({
  toast: {
    success: (...args: unknown[]) => mocks.toastSuccess(...args),
    error: (...args: unknown[]) => mocks.toastError(...args)
  }
}))

describe('ViewportQuicksaveButton', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('affiche le bouton en état initial idle avec icône save', () => {
    const wrapper = mount(ViewportQuicksaveButton)
    const button = wrapper.find('[data-test="viewport-quicksave-btn"]')

    expect(button.exists()).toBe(true)
    expect(button.attributes('aria-label')).toContain('Sauvegarde rapide')
    expect(button.text()).toContain('save')
  })

  it('exécute la sauvegarde et affiche le succès puis revient à idle après 2000ms', async () => {
    const wrapper = mount(ViewportQuicksaveButton)
    const button = wrapper.find('[data-test="viewport-quicksave-btn"]')

    await button.trigger('click')
    await flushPromises()

    expect(mocks.endGesture).toHaveBeenCalled()
    expect(mocks.createSnapshot).toHaveBeenCalled()
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      'Keyframe enregistrée',
      expect.stringContaining('Keyframe')
    )

    expect(wrapper.emitted('saved')?.[0]?.[0]).toEqual(mocks.snapshot)
    expect(button.text()).toContain('check')
    expect(button.attributes('aria-label')).toContain('enregistrée')

    vi.advanceTimersByTime(2000)
    await wrapper.vm.$nextTick()

    expect(button.text()).toContain('save')
  })

  it('ne déclenche rien lorsque la prop disabled est active', async () => {
    const wrapper = mount(ViewportQuicksaveButton, {
      props: { disabled: true }
    })
    const button = wrapper.find('[data-test="viewport-quicksave-btn"]')

    await button.trigger('click')
    await flushPromises()

    expect(mocks.createSnapshot).not.toHaveBeenCalled()
  })

  it('gère l’échec de capture avec affichage de l’état error', async () => {
    mocks.captureCleanFrame.mockRejectedValueOnce(new Error('Erreur capture'))

    const wrapper = mount(ViewportQuicksaveButton)
    const button = wrapper.find('[data-test="viewport-quicksave-btn"]')

    await button.trigger('click')
    await flushPromises()

    expect(mocks.toastError).toHaveBeenCalledWith('Échec de la sauvegarde', 'Erreur capture')
    expect(button.text()).toContain('close')

    vi.advanceTimersByTime(2000)
    await wrapper.vm.$nextTick()

    expect(button.text()).toContain('save')
  })
})
