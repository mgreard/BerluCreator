import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Asset } from '@core/types/asset.types'
import type { CharacterGroup, ViewportSnapshot } from '@core/types/editor.types'
import { DEFAULT_TRANSFORM } from '@core/constants/editor'
import { editorDocumentRepository } from '@infrastructure/db/repositories/editor-document.repository'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useEditorStore } from './useEditorStore'

vi.mock('@infrastructure/db/repositories/editor-document.repository', () => ({
  editorDocumentRepository: {
    getById: vi.fn().mockResolvedValue(undefined),
    getByProjectId: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined)
  }
}))

function characterAsset(id: string, name: string, key: string, category: Asset['category']): Asset {
  return {
    id,
    name,
    category,
    tags: [],
    blobId: `blob-${id}`,
    width: 840,
    height: 908,
    character: { key, name: key === 'berlu' ? 'Berlu' : 'Pedro', form: category === 'character_full' ? 'full' : 'rig' },
    isMovable: false,
    createdAt: 1,
    updatedAt: 1
  }
}

describe('useEditorStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initialise Berlu comme groupe personnage et unique source de transform', () => {
    const store = useEditorStore()
    const berlu = store.currentDocument.groups.find((group) => group.id === 'grp_berlu')
    expect(berlu).toMatchObject({ kind: 'character', activeMode: 'rig', muted: false })
    expect(berlu?.transform).toEqual(DEFAULT_TRANSFORM)
    expect(store.currentDocument).not.toHaveProperty('character')
  })

  it('conserve le sprite complet et le rig tout en basculant le mode actif', () => {
    const store = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [
      characterAsset('full', 'Berlu complet', 'berlu', 'character_full'),
      characterAsset('head', 'Tête Berlu', 'berlu', 'head')
    ]

    const full = store.assignAssetToGroup('full', 'character_full')
    const head = store.assignAssetToGroup('head', 'head')
    const berlu = store.currentDocument.groups.find((group): group is CharacterGroup => group.id === full.groupId && group.kind === 'character')

    expect(store.currentDocument.layers.map((layer) => layer.id)).toEqual([full.id, head.id])
    expect(berlu?.activeMode).toBe('rig')
    store.setCharacterMode(berlu!.id, 'full')
    expect(berlu?.activeMode).toBe('full')
    expect(store.currentDocument.layers).toHaveLength(2)
  })

  it('applique la cardinalité des slots par personnage', () => {
    const store = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [
      characterAsset('berlu-head', 'Tête Berlu', 'berlu', 'head'),
      characterAsset('pedro-head', 'Tête Pedro', 'pedro', 'head')
    ]

    const berluHead = store.assignAssetToGroup('berlu-head', 'head')
    const pedroHead = store.assignAssetToGroup('pedro-head', 'head')

    expect(store.currentDocument.layers).toHaveLength(2)
    expect(berluHead.groupId).not.toBe(pedroHead.groupId)
    expect(store.currentDocument.groups.filter((group) => group.kind === 'character')).toHaveLength(2)
  })

  it('annule et rétablit une mutation structurelle et une gesture', async () => {
    const store = useEditorStore()
    const layer = store.assignAssetToGroup('prop', 'props_set')
    store.beginGesture('Déplacer')
    store.updateLayerTransform(layer.id, { x: 100, y: 200 })
    store.endGesture()
    expect(store.currentDocument.layers[0].transform.x).toBe(100)

    store.undo()
    expect(store.currentDocument.layers[0].transform.x).toBe(0)
    store.undo()
    expect(store.currentDocument.layers).toHaveLength(0)
    store.redo()
    expect(store.currentDocument.layers).toHaveLength(1)
    await store.flushPersistence()
    expect(editorDocumentRepository.save).toHaveBeenCalled()
  })

  it('ne remet pas la caméra en arrière lors d’un undo studio', () => {
    const store = useEditorStore()
    store.assignAssetToGroup('prop', 'props_set')
    store.updateCamera({ enabled: true, x: 12, y: 18, width: 800, height: 600, aspectRatio: 'custom' })
    store.undo()
    expect(store.currentDocument.layers).toHaveLength(0)
    expect(store.currentDocument.camera).toMatchObject({ enabled: true, x: 12, y: 18 })
  })

  it('historise le mode, le verrouillage et l’ordre des calques', () => {
    const store = useEditorStore()
    const first = store.assignAssetToGroup('prop-1', 'props_set')
    const second = store.assignAssetToGroup('prop-2', 'props_set')

    store.moveLayer(first.id, 1)
    expect(first.order).toBeGreaterThan(second.order)
    store.setLayerLocked(first.id, true)
    expect(first.locked).toBe(true)
    store.undo()
    expect(store.currentDocument.layers.find((layer) => layer.id === first.id)?.locked).toBe(false)
    store.undo()
    expect(store.currentDocument.layers.find((layer) => layer.id === first.id)?.order).toBeLessThan(
      store.currentDocument.layers.find((layer) => layer.id === second.id)!.order
    )

    const group = store.currentDocument.groups.find((candidate) => candidate.kind === 'character')!
    store.setCharacterMode(group.id, 'full')
    store.undo()
    expect((store.currentDocument.groups.find((candidate) => candidate.id === group.id) as CharacterGroup).activeMode).toBe('rig')
    store.redo()
    expect((store.currentDocument.groups.find((candidate) => candidate.id === group.id) as CharacterGroup).activeMode).toBe('full')
  })

  it('rebascule vers le rig après suppression du sprite complet actif et vide l’historique', () => {
    const store = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [
      characterAsset('full', 'Berlu complet', 'berlu', 'character_full'),
      characterAsset('head', 'Tête Berlu', 'berlu', 'head')
    ]
    const full = store.assignAssetToGroup('full', 'character_full')
    store.assignAssetToGroup('head', 'head')
    const group = store.currentDocument.groups.find(
      (candidate): candidate is CharacterGroup => candidate.id === full.groupId && candidate.kind === 'character'
    )!
    store.setCharacterMode(group.id, 'full')

    store.syncAfterAssetDeletion('full')

    expect(group.activeMode).toBe('rig')
    expect(store.currentDocument.layers.map((layer) => layer.assetId)).toEqual(['head'])
    expect(store.canUndo).toBe(false)
  })

  it('applique un snapshot et vide l’historique', () => {
    const store = useEditorStore()
    store.assignAssetToGroup('old', 'background')
    const snapshot: ViewportSnapshot = {
      id: 'snap',
      name: 'Vue',
      thumbnailDataUrl: '',
      camera: { enabled: true, x: 10, y: 20, width: 800, height: 600, aspectRatio: 'custom' },
      groups: store.currentDocument.groups,
      layers: [],
      createdAt: 1,
      updatedAt: 1
    }
    expect(store.applyViewportSnapshot(snapshot)).toBe(0)
    expect(store.canUndo).toBe(false)
    expect(store.currentDocument.camera.enabled).toBe(true)
  })
})
