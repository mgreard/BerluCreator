import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { DEFAULT_EDITOR_GROUPS } from '@core/constants/editor'
import type { EditorDocument } from '@core/types/editor.types'
import { useViewportSnapshotStore } from './useViewportSnapshotStore'

vi.mock('@infrastructure/db/repositories/viewport-snapshot.repository', () => ({
  viewportSnapshotRepository: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined)
  }
}))

function documentFixture(): EditorDocument {
  return {
    id: 'doc',
    projectId: 'project',
    name: 'Document',
    camera: { enabled: true, x: 0, y: 0, width: 1792, height: 1024, aspectRatio: '16:9' },
    groups: JSON.parse(JSON.stringify(DEFAULT_EDITOR_GROUPS)),
    layers: [],
    createdAt: 1,
    updatedAt: 1
  }
}

describe('useViewportSnapshotStore', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('copie les groupes, modes et calques sans partager leurs références', async () => {
    const store = useViewportSnapshotStore()
    const document = documentFixture()
    const snapshot = await store.createSnapshot(document, 'Vue', 'data:image/png;base64,abc')
    expect(snapshot.groups).toEqual(document.groups)
    expect(snapshot.groups).not.toBe(document.groups)
    expect(snapshot.thumbnailDataUrl).toContain('data:image/png')
  })

  it('supprime un snapshot par identifiant', async () => {
    const store = useViewportSnapshotStore()
    const created = await store.createSnapshot(documentFixture(), 'À supprimer', '')
    await store.deleteSnapshot(created.id)
    expect(store.snapshots).toHaveLength(0)
  })
})
