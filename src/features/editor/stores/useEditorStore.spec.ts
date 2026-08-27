import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEditorStore } from './useEditorStore'
import type { ViewportSnapshot } from '@core/types/editor.types'

vi.mock('@infrastructure/db/repositories/editor-document.repository', () => ({
  editorDocumentRepository: {
    getById: vi.fn().mockResolvedValue(undefined),
    getByProjectId: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined)
  }
}))

describe('useEditorStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initialise un document d’édition par défaut avec rig personnage, groupes et caméra', () => {
    const store = useEditorStore()
    expect(store.currentDocument.id).toBe('doc_default')
    expect(store.currentDocument.character).toBeDefined()
    expect(store.currentDocument.character.visible).toBe(true)
    expect(store.currentDocument.character.scaleX).toBe(1)
    expect(store.currentDocument.groups?.length).toBeGreaterThan(0)
    expect(store.currentDocument.layers).toHaveLength(0)
    expect(store.currentDocument.camera.enabled).toBe(false)
  })

  it('assignAssetToGroup gère la cardinalité singleton en remplaçant le calque existant', () => {
    const store = useEditorStore()
    const firstLayer = store.assignAssetToGroup('asset-head-1', 'head', null, 'Tête 1')
    expect(store.currentDocument.layers).toHaveLength(1)
    expect(firstLayer.assetId).toBe('asset-head-1')

    const secondLayer = store.assignAssetToGroup('asset-head-2', 'head', null, 'Tête 2')
    expect(store.currentDocument.layers).toHaveLength(1)
    expect(secondLayer.id).toBe(firstLayer.id)
    expect(secondLayer.assetId).toBe('asset-head-2')
  })

  it('assignAssetToGroup gère la cardinalité multi en ajoutant des calques distincts', () => {
    const store = useEditorStore()
    const item1 = store.assignAssetToGroup('prop-1', 'props_set', null, 'Accessoire 1')
    const item2 = store.assignAssetToGroup('prop-2', 'props_set', null, 'Accessoire 2')

    expect(store.currentDocument.layers).toHaveLength(2)
    expect(item1.id).not.toBe(item2.id)
    expect(item2.order!).toBeGreaterThan(item1.order!)
  })

  it('permet de déplacer, masquer et verrouiller un calque', () => {
    const store = useEditorStore()
    const layer = store.assignAssetToGroup('asset-torso', 'torso')

    store.updateLayerTransform(layer.id, { x: 50, y: 100, scaleX: 1.2 })
    expect(store.currentDocument.layers[0].transform).toEqual({ x: 50, y: 100, scaleX: 1.2 })

    store.setLayerMuted(layer.id, true)
    expect(store.currentDocument.layers[0].muted).toBe(true)

    store.setLayerLocked(layer.id, true)
    expect(store.currentDocument.layers[0].locked).toBe(true)

    store.removeLayer(layer.id)
    expect(store.currentDocument.layers).toHaveLength(0)
  })

  it('permet de manipuler le Rig global du personnage', () => {
    const store = useEditorStore()
    store.updateCharacterTransform({ x: 120, y: -40, scaleX: 1.15, scaleY: 1.15 })

    expect(store.currentDocument.character.x).toBe(120)
    expect(store.currentDocument.character.y).toBe(-40)
    expect(store.currentDocument.character.scaleX).toBe(1.15)

    store.toggleCharacterMuted()
    expect(store.currentDocument.character.visible).toBe(false)
  })

  it('gère l’historique undo/redo sur les transformations de calque', () => {
    const store = useEditorStore()
    const layer = store.assignAssetToGroup('asset-1', 'props_set')

    store.selectLayerForEditing(layer.id)
    store.beginTransformGesture()
    store.updateLayerTransform(layer.id, { x: 100, y: 200 })
    store.endTransformGesture()

    expect(store.currentDocument.layers[0].transform?.x).toBe(100)
    expect(store.canUndoTransform).toBe(true)

    store.undoLastTransform()
    expect(store.currentDocument.layers[0].transform?.x).toBeUndefined()
    expect(store.canRedoTransform).toBe(true)

    store.redoLastTransform()
    expect(store.currentDocument.layers[0].transform?.x).toBe(100)
  })

  it('applique atomiquement un ViewportSnapshot en remplaçant la scène courante', () => {
    const store = useEditorStore()
    store.assignAssetToGroup('old-asset', 'background')

    const snapshot: ViewportSnapshot = {
      id: 'snap-1',
      name: 'Vue Test',
      thumbnailDataUrl: '',
      camera: { enabled: true, x: 10, y: 20, width: 800, height: 600, aspectRatio: '16:9' },
      character: { x: 50, y: 25, scaleX: 1.1, scaleY: 1.1, rotation: 0, visible: true, zIndex: 10 },
      groups: [{ id: 'grp-test', name: 'Groupe Snap', zIndex: 10, allowedCategories: [] }],
      layers: [{
        id: 'layer-snap',
        assetId: 'asset-new',
        name: 'Nouveau',
        category: 'torso',
        groupId: 'grp-test',
        zIndex: 10,
        order: 0,
        muted: false,
        locked: false
      }],
      createdAt: 1,
      updatedAt: 1
    }

    const count = store.applyViewportSnapshot(snapshot)
    expect(count).toBe(1)
    expect(store.currentDocument.camera.enabled).toBe(true)
    expect(store.currentDocument.character.x).toBe(50)
    expect(store.currentDocument.layers[0].assetId).toBe('asset-new')
    expect(store.currentDocument.groups?.[0]?.name).toBe('Groupe Snap')
  })
})
