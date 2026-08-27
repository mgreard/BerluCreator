import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useViewportSnapshotStore } from './useViewportSnapshotStore'
import type { EditorDocument } from '@core/types/editor.types'

vi.mock('@infrastructure/db/repositories/viewport-snapshot.repository', () => ({
  viewportSnapshotRepository: {
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined)
  }
}))

describe('useViewportSnapshotStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('crée un snapshot autonome à partir d’un EditorDocument', async () => {
    const store = useViewportSnapshotStore()
    const doc: EditorDocument = {
      id: 'doc-1',
      projectId: 'proj-1',
      name: 'Doc Test',
      camera: { enabled: true, x: 0, y: 0, width: 1792, height: 1024, aspectRatio: '16:9' },
      character: { x: 10, y: 20, scaleX: 1, scaleY: 1, rotation: 0, visible: true, zIndex: 10 },
      groups: [{ id: 'grp-1', name: 'Groupe 1', zIndex: 10, allowedCategories: [] }],
      layers: [{
        id: 'layer-1',
        assetId: 'asset-1',
        name: 'Sprite 1',
        category: 'torso',
        groupId: 'grp-1',
        zIndex: 10,
        order: 0,
        muted: false,
        locked: false
      }],
      createdAt: 1000,
      updatedAt: 1000
    }

    const snapshot = await store.createSnapshot(doc, 'Ma Super Vue', 'data:image/png;base64,abc')
    expect(snapshot.name).toBe('Ma Super Vue')
    expect(snapshot.thumbnailDataUrl).toBe('data:image/png;base64,abc')
    expect(snapshot.camera.enabled).toBe(true)
    expect(snapshot.character.x).toBe(10)
    expect(snapshot.layers).toHaveLength(1)
    expect(store.snapshots).toHaveLength(1)
  })

  it('supprime un snapshot par identifiant', async () => {
    const store = useViewportSnapshotStore()
    const doc: EditorDocument = {
      id: 'doc-1',
      projectId: 'proj-1',
      name: 'Doc',
      camera: { enabled: false, x: 0, y: 0, width: 100, height: 100, aspectRatio: '1:1' },
      character: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, visible: true, zIndex: 10 },
      groups: [],
      layers: [],
      createdAt: 1,
      updatedAt: 1
    }

    const created = await store.createSnapshot(doc, 'Vue à supprimer', '')
    expect(store.snapshots).toHaveLength(1)

    await store.deleteSnapshot(created.id)
    expect(store.snapshots).toHaveLength(0)
  })
})
