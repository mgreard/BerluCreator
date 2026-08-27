import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useHierarchyResolver } from './useHierarchyResolver'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import type { Asset } from '@core/types/asset.types'

vi.mock('@infrastructure/db/repositories/editor-document.repository', () => ({
  editorDocumentRepository: {
    getById: vi.fn(),
    getByProjectId: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined)
  }
}))

function createAsset(id: string, overrides: Partial<Asset> = {}): Asset {
  return {
    id,
    name: id,
    category: 'props_set',
    tags: [],
    blobId: `blob-${id}`,
    width: 1792,
    height: 1024,
    isMovable: true,
    createdAt: 1,
    updatedAt: 1,
    ...overrides
  }
}

describe('useHierarchyResolver direct scene layers', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('produit un calque indépendant pour chaque calque du document', () => {
    const editorStore = useEditorStore()
    const assetStore = useAssetStore()
    assetStore.assets = [createAsset('asset-stop'), createAsset('asset-banana')]

    editorStore.assignAssetToGroup('asset-stop', 'props_set')
    editorStore.assignAssetToGroup('asset-banana', 'props_set')

    const { activeLayers } = useHierarchyResolver()
    const propsLayers = activeLayers.value.filter((layer) => layer.category === 'props_set')

    expect(propsLayers).toHaveLength(2)
    expect(new Set(propsLayers.map((layer) => layer.layerId)).size).toBe(2)
    expect(propsLayers.map((layer) => layer.order)).toEqual([0, 1])
  })

  it('déplace solidairement les pièces du corps lorsque le Rig Character bouge', () => {
    const editorStore = useEditorStore()
    const assetStore = useAssetStore()
    assetStore.assets = [
      createAsset('asset-torso', { category: 'torso', width: 400, height: 400 }),
      createAsset('asset-head', { category: 'head', width: 200, height: 200 })
    ]

    const torso = editorStore.assignAssetToGroup('asset-torso', 'torso')
    const head = editorStore.assignAssetToGroup('asset-head', 'head')

    const { activeLayers } = useHierarchyResolver()
    const initialTorso = activeLayers.value.find((l) => l.layerId === torso.id)
    const initialHead = activeLayers.value.find((l) => l.layerId === head.id)

    expect(initialTorso).toBeDefined()
    expect(initialHead).toBeDefined()

    // Déplacement global du personnage
    editorStore.updateCharacterTransform({ x: 100, y: 50 })

    const movedTorso = activeLayers.value.find((l) => l.layerId === torso.id)
    const movedHead = activeLayers.value.find((l) => l.layerId === head.id)

    expect(movedTorso!.x).toBe(initialTorso!.x + 100)
    expect(movedTorso!.y).toBe(initialTorso!.y + 50)
    expect(movedHead!.x).toBe(initialHead!.x + 100)
    expect(movedHead!.y).toBe(initialHead!.y + 50)
  })

  it('applique la contrainte Cover au calque de fond', () => {
    const editorStore = useEditorStore()
    const assetStore = useAssetStore()
    assetStore.assets = [
      createAsset('asset-bg', { category: 'background', width: 3840, height: 2160 })
    ]

    const bgLayer = editorStore.assignAssetToGroup('asset-bg', 'background')
    editorStore.updateLayerTransform(bgLayer.id, { x: 500, y: 200 }) // translation excessive vers l'intérieur

    const { activeLayers } = useHierarchyResolver()
    const resolvedBg = activeLayers.value.find((l) => l.layerId === bgLayer.id)

    expect(resolvedBg).toBeDefined()
    expect(resolvedBg!.x).toBe(0) // Clamped to 0 (pas de bord transparent à gauche)
    expect(resolvedBg!.y).toBe(0) // Clamped to 0 (pas de bord transparent en haut)
  })

  it('stabilise la taille logique d’un sprite libre avant et après son déplacement', () => {
    const editorStore = useEditorStore()
    const assetStore = useAssetStore()
    assetStore.assets = [
      createAsset('asset-free', {
        width: 640,
        height: 360,
        displayWidth: 320,
        displayHeight: 180
      })
    ]

    const layer = editorStore.assignAssetToGroup('asset-free', 'props_set')
    const { activeLayers } = useHierarchyResolver()
    const initialLayer = activeLayers.value.find((l) => l.layerId === layer.id)

    expect(initialLayer).toMatchObject({ x: 736, y: 422, width: 320, height: 180 })

    editorStore.updateLayerTransform(layer.id, { x: 80, y: 120 })

    const movedLayer = activeLayers.value.find((l) => l.layerId === layer.id)
    expect(movedLayer).toMatchObject({ x: 80, y: 120, width: 320, height: 180 })
  })
})
