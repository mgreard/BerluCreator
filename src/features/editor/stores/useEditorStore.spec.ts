import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Asset } from '@core/types/asset.types'
import type { CharacterGroup, ViewportSnapshot } from '@core/types/editor.types'
import { DEFAULT_DEPTH_OF_FIELD_SETTINGS, DEFAULT_TRANSFORM } from '@core/constants/editor'
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
    character: {
      key,
      name: key === 'berlu' ? 'Berlu' : 'Pedro',
      form: category === 'character_full' ? 'full' : 'rig'
    },
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
    expect(store.currentDocument.depthOfField).toEqual(DEFAULT_DEPTH_OF_FIELD_SETTINGS)
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
    const berlu = store.currentDocument.groups.find(
      (group): group is CharacterGroup => group.id === full.groupId && group.kind === 'character'
    )

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
    expect(store.currentDocument.groups.filter((group) => group.kind === 'character')).toHaveLength(
      2
    )
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
    store.updateCamera({
      enabled: true,
      x: 12,
      y: 18,
      width: 800,
      height: 600,
      aspectRatio: 'custom'
    })
    store.undo()
    expect(store.currentDocument.layers).toHaveLength(0)
    expect(store.currentDocument.camera).toMatchObject({ enabled: true, x: 12, y: 18 })
  })

  it('active la profondeur de champ comme une mutation annulable', () => {
    const store = useEditorStore()
    store.updateDepthOfField({ enabled: true })
    expect(store.currentDocument.depthOfField.enabled).toBe(true)
    store.undo()
    expect(store.currentDocument.depthOfField.enabled).toBe(false)
    store.redo()
    expect(store.currentDocument.depthOfField.enabled).toBe(true)
  })

  it('regroupe un réglage continu de profondeur de champ en une seule entrée', () => {
    const store = useEditorStore()
    store.beginGesture('Déplacer la ligne de focus')
    store.updateDepthOfField({ focusY: 0.55 })
    store.updateDepthOfField({ focusY: 0.48 })
    store.updateDepthOfField({ focusY: 0.42 })
    store.endGesture()

    expect(store.currentDocument.depthOfField.focusY).toBe(0.42)
    store.undo()
    expect(store.currentDocument.depthOfField.focusY).toBe(DEFAULT_DEPTH_OF_FIELD_SETTINGS.focusY)
    expect(store.canUndo).toBe(false)
  })

  it('classe un accessoire dans le décor ou le sujet avec undo/redo', () => {
    const store = useEditorStore()
    const layer = store.assignAssetToGroup('prop', 'props_set')

    expect(layer.depthRole).toBe('auto')
    store.setLayerDepthRole(layer.id, 'background')
    expect(layer.depthRole).toBe('background')

    store.undo()
    expect(store.currentDocument.layers[0]?.depthRole).toBe('auto')
    store.redo()
    expect(store.currentDocument.layers[0]?.depthRole).toBe('background')
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
    expect(
      (
        store.currentDocument.groups.find(
          (candidate) => candidate.id === group.id
        ) as CharacterGroup
      ).activeMode
    ).toBe('rig')
    store.redo()
    expect(
      (
        store.currentDocument.groups.find(
          (candidate) => candidate.id === group.id
        ) as CharacterGroup
      ).activeMode
    ).toBe('full')
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
      (candidate): candidate is CharacterGroup =>
        candidate.id === full.groupId && candidate.kind === 'character'
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
      depthOfField: { ...DEFAULT_DEPTH_OF_FIELD_SETTINGS, enabled: true },
      groups: store.currentDocument.groups,
      layers: [],
      createdAt: 1,
      updatedAt: 1
    }
    expect(store.applyViewportSnapshot(snapshot)).toBe(0)
    expect(store.canUndo).toBe(false)
    expect(store.currentDocument.camera.enabled).toBe(true)
    expect(store.currentDocument.depthOfField.enabled).toBe(true)
  })

  it('ajoute, remplace puis retire un slot de rig par clic', () => {
    const store = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [
      characterAsset('head-a', 'Tête A', 'berlu', 'head'),
      characterAsset('head-b', 'Tête B', 'berlu', 'head')
    ]

    const first = store.toggleAssetInViewport('head-a', 'head')
    expect(first?.assetId).toBe('head-a')
    expect(store.editScope).toBe('group')
    expect(store.selectedLayerId).toBeNull()
    store.selectLayerForEditing(first!.id)
    expect(store.editScope).toBe('group')
    expect(store.selectedLayerId).toBeNull()
    store.selectRigLayerForCalibration(first!.id)
    expect(store.editScope).toBe('layer')
    expect(store.selectedLayerId).toBe(first!.id)
    store.updateLayerTransform(first!.id, { x: 120, y: 30, scaleX: 0.7, scaleY: 0.7 })

    const replacement = store.toggleAssetInViewport('head-b', 'head')
    expect(replacement?.id).toBe(first?.id)
    expect(store.currentDocument.layers.filter((layer) => layer.category === 'head')).toHaveLength(
      1
    )
    expect(store.currentDocument.layers[0].assetId).toBe('head-b')
    expect(replacement?.transform).toMatchObject({ x: 0, y: 0, scaleX: 1, scaleY: 1 })

    expect(store.toggleAssetInViewport('head-b', 'head')).toBeNull()
    expect(store.currentDocument.layers.filter((layer) => layer.category === 'head')).toHaveLength(
      0
    )
  })

  it('réactive une représentation inactive avant de la retirer au clic suivant', () => {
    const store = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [
      characterAsset('full', 'Berlu complet', 'berlu', 'character_full'),
      characterAsset('head', 'Tête Berlu', 'berlu', 'head')
    ]

    const full = store.toggleAssetInViewport('full', 'character_full')!
    store.toggleAssetInViewport('head', 'head')
    const group = store.currentDocument.groups.find(
      (candidate): candidate is CharacterGroup =>
        candidate.id === full.groupId && candidate.kind === 'character'
    )!
    expect(group.activeMode).toBe('rig')
    expect(store.currentDocument.layers).toHaveLength(2)

    expect(store.toggleAssetInViewport('full', 'character_full')?.id).toBe(full.id)
    expect(group.activeMode).toBe('full')
    expect(store.currentDocument.layers).toHaveLength(2)

    expect(store.toggleAssetInViewport('full', 'character_full')).toBeNull()
    expect(store.currentDocument.layers.map((layer) => layer.assetId)).toEqual(['head'])
  })

  it('normalise toujours les transformations sur une échelle uniforme', () => {
    const store = useEditorStore()
    const layer = store.assignAssetToGroup('prop', 'props_set')
    store.updateLayerTransform(layer.id, { scaleY: 1.75 })
    expect(layer.transform).toMatchObject({ scaleX: 1.75, scaleY: 1.75 })

    const group = store.currentDocument.groups.find((candidate) => candidate.kind === 'character')!
    store.updateGroupTransform(group.id, { scaleX: 0.8, scaleY: 2 })
    expect(group.transform).toMatchObject({ scaleX: 0.8, scaleY: 0.8 })
  })

  it('retire le rig actif en une action sans supprimer le sprite complet mémorisé', () => {
    const store = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [
      characterAsset('full', 'Berlu complet', 'berlu', 'character_full'),
      characterAsset('body', 'Corps Berlu', 'berlu', 'body'),
      characterAsset('head', 'Tête Berlu', 'berlu', 'head')
    ]
    const full = store.assignAssetToGroup('full', 'character_full')
    store.assignAssetToGroup('body', 'body')
    store.assignAssetToGroup('head', 'head')

    expect(store.removeActiveCharacterRepresentation(full.groupId)).toBe(2)
    expect(store.currentDocument.layers.map((layer) => layer.assetId)).toEqual(['full'])
    expect(store.selectedGroupId).toBeNull()

    store.undo()
    expect(store.currentDocument.layers.map((layer) => layer.assetId)).toEqual([
      'full',
      'body',
      'head'
    ])
  })
})
