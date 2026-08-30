import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Asset } from '@core/types/asset.types'
import type { CharacterGroup, ViewportSnapshot } from '@core/types/editor.types'
import {
  DEFAULT_COLOR_GRADING_SETTINGS,
  DEFAULT_DEPTH_OF_FIELD_SETTINGS,
  DEFAULT_SHADER_SETTINGS,
  DEFAULT_TRANSFORM
} from '@core/constants/editor'
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

  it('crée des occurrences indépendantes pour un même accessoire libre', () => {
    const store = useEditorStore()
    const assets = useAssetStore()
    const glasses = characterAsset('glasses', 'Lunettes', 'berlu', 'eyes')
    glasses.isMovable = true
    assets.assets = [glasses]

    const first = store.assignAssetToGroup(glasses.id, glasses.category)
    const second = store.assignAssetToGroup(glasses.id, glasses.category)
    const group = store.currentDocument.groups.find((candidate) => candidate.id === first.groupId)

    expect(first.id).not.toBe(second.id)
    expect(first.groupId).toBe(second.groupId)
    expect(group).toMatchObject({ kind: 'stage', id: 'grp_accessories' })
    expect(store.currentDocument.layers.filter((layer) => layer.assetId === glasses.id)).toHaveLength(2)
    expect(store.selectedLayerId).toBe(second.id)
  })

  it('détache les anciens accessoires du groupe personnage au chargement', async () => {
    const store = useEditorStore()
    const assets = useAssetStore()
    const glasses = characterAsset('legacy-glasses', 'Anciennes lunettes', 'berlu', 'eyes')
    glasses.width = 200
    glasses.height = 80
    assets.assets = [glasses]

    const legacyDocument = JSON.parse(JSON.stringify(store.currentDocument))
    const characterGroup = legacyDocument.groups.find((group: CharacterGroup) => group.kind === 'character')
    characterGroup.allowedCategories.push('eyes')
    characterGroup.transform = { x: 30, y: -10, scaleX: 1.2, scaleY: 1.2, rotation: 20, opacity: 1 }
    legacyDocument.layers.push({
      id: 'legacy-layer',
      assetId: glasses.id,
      name: glasses.name,
      category: 'eyes',
      groupId: characterGroup.id,
      zIndex: 26,
      order: 0,
      muted: false,
      locked: false,
      depthRole: 'auto',
      transform: { x: 250, y: 120, scaleX: 0.8, scaleY: 0.8, rotation: 5, opacity: 1 }
    })
    vi.mocked(editorDocumentRepository.getById).mockResolvedValueOnce(legacyDocument)

    await store.loadDocument('doc_default')

    const migrated = store.currentDocument.layers.find((layer) => layer.id === 'legacy-layer')
    const migratedCharacter = store.currentDocument.groups.find(
      (group): group is CharacterGroup => group.id === characterGroup.id && group.kind === 'character'
    )
    expect(migrated).toMatchObject({ groupId: 'grp_accessories', depthRole: 'subject' })
    expect(migrated?.transform.rotation).toBe(25)
    expect(migrated?.transform.scaleX).toBeGreaterThan(0)
    expect(migratedCharacter?.allowedCategories).not.toContain('eyes')
    expect(editorDocumentRepository.save).toHaveBeenCalled()
  })

  it('réserve la sélection de groupe aux personnages et garde les props atomiques', () => {
    const store = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [characterAsset('head', 'Tête Berlu', 'berlu', 'head')]

    const characterLayer = store.assignAssetToGroup('head', 'head')
    const propLayer = store.assignAssetToGroup('prop', 'props_set')

    store.selectGroupForEditing(characterLayer.groupId)
    expect(store.editScope).toBe('group')
    expect(store.selectedGroupId).toBe(characterLayer.groupId)
    expect(store.selectedLayerId).toBeNull()

    store.selectLayerForEditing(propLayer.id)
    expect(store.editScope).toBe('layer')
    expect(store.selectedGroupId).toBe(propLayer.groupId)
    expect(store.selectedLayerId).toBe(propLayer.id)

    store.selectGroupForEditing(propLayer.groupId)
    expect(store.editScope).toBe('layer')
    expect(store.selectedGroupId).toBeNull()
    expect(store.selectedLayerId).toBeNull()

    store.selectLayerForEditing(propLayer.id)
    store.removeLayer(propLayer.id)
    expect(store.editScope).toBe('layer')
    expect(store.selectedGroupId).toBeNull()
    expect(store.selectedLayerId).toBeNull()
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

  it('historise et normalise une distance optique personnalisée sans changer le z-index', () => {
    const store = useEditorStore()
    const layer = store.assignAssetToGroup('prop', 'props_set')
    const initialZIndex = layer.zIndex

    store.setLayerOpticalDepth(layer.id, 1.4)
    expect(layer.opticalDepth).toBe(1)
    expect(layer.zIndex).toBe(initialZIndex)

    store.undo()
    expect(store.currentDocument.layers[0]?.opticalDepth).toBeUndefined()
    store.redo()
    expect(store.currentDocument.layers[0]?.opticalDepth).toBe(1)

    store.setLayerDepthRole(layer.id, 'subject')
    expect(store.currentDocument.layers[0]).toMatchObject({ depthRole: 'subject' })
    expect(store.currentDocument.layers[0]?.opticalDepth).toBeUndefined()
  })

  it('applique et historise la distance optique et le rôle de profondeur sur un groupe entier', () => {
    const store = useEditorStore()
    const group = store.currentDocument.groups.find((candidate) => candidate.kind === 'character')!

    store.setGroupOpticalDepth(group.id, 0.8)
    const currentGroup = store.currentDocument.groups.find((candidate) => candidate.id === group.id)
    expect(currentGroup?.opticalDepth).toBe(0.8)
    const characterLayers = store.currentDocument.layers.filter((l) => l.groupId === group.id)
    for (const l of characterLayers) {
      expect(l.opticalDepth).toBe(0.8)
    }

    store.undo()
    const undoneGroup = store.currentDocument.groups.find((candidate) => candidate.id === group.id)
    expect(undoneGroup?.opticalDepth).toBeUndefined()
    const undoneLayers = store.currentDocument.layers.filter((l) => l.groupId === group.id)
    for (const l of undoneLayers) {
      expect(l.opticalDepth).toBeUndefined()
    }

    store.setGroupDepthRole(group.id, 'background')
    const backgroundGroup = store.currentDocument.groups.find(
      (candidate) => candidate.id === group.id
    )
    expect(backgroundGroup?.depthRole).toBe('background')
    const backgroundLayers = store.currentDocument.layers.filter((l) => l.groupId === group.id)
    for (const l of backgroundLayers) {
      expect(l.depthRole).toBe('background')
    }
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
      colorGrading: { ...DEFAULT_COLOR_GRADING_SETTINGS },
      shaderSettings: { ...DEFAULT_SHADER_SETTINGS },
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

  it('permet de retourner un calque horizontalement et de l’annuler avec undo/redo', () => {
    const store = useEditorStore()
    const layer = store.assignAssetToGroup('prop-flip', 'props_set')
    expect(layer.transform.scaleX).toBe(1)
    expect(layer.transform.scaleY).toBe(1)

    store.toggleLayerHorizontalFlip(layer.id)
    expect(layer.transform.scaleX).toBe(-1)
    expect(layer.transform.scaleY).toBe(1)

    store.toggleLayerHorizontalFlip(layer.id)
    expect(layer.transform.scaleX).toBe(1)
    expect(layer.transform.scaleY).toBe(1)

    store.undo()
    expect(store.currentDocument.layers.find((c) => c.id === layer.id)?.transform.scaleX).toBe(-1)

    store.redo()
    expect(store.currentDocument.layers.find((c) => c.id === layer.id)?.transform.scaleX).toBe(1)
  })

  it('permet de retourner un groupe de personnage horizontalement', () => {
    const store = useEditorStore()
    const group = store.currentDocument.groups.find((candidate) => candidate.kind === 'character')!
    expect(group.transform.scaleX).toBe(1)
    expect(group.transform.scaleY).toBe(1)

    store.toggleGroupHorizontalFlip(group.id)
    expect(group.transform.scaleX).toBe(-1)
    expect(group.transform.scaleY).toBe(1)

    store.updateGroupTransform(group.id, { scaleX: -1.5, scaleY: 1.5 })
    expect(group.transform.scaleX).toBe(-1.5)
    expect(group.transform.scaleY).toBe(1.5)

    store.undo()
    expect(store.currentDocument.groups.find((c) => c.id === group.id)?.transform.scaleX).toBe(-1)
  })

  it('met à jour, réinitialise et historise le color grading global', () => {
    const store = useEditorStore()
    expect(store.currentDocument.colorGrading.enabled).toBe(false)
    expect(store.currentDocument.colorGrading.preset).toBe('neutral')

    store.updateColorGrading({
      enabled: true,
      preset: 'warm',
      exposure: 2,
      contrast: 4,
      saturation: 8,
      temperature: 18,
      tint: 0
    })

    expect(store.currentDocument.colorGrading.enabled).toBe(true)
    expect(store.currentDocument.colorGrading.preset).toBe('warm')
    expect(store.currentDocument.colorGrading.temperature).toBe(18)

    store.undo()
    expect(store.currentDocument.colorGrading.enabled).toBe(false)
    expect(store.currentDocument.colorGrading.preset).toBe('neutral')

    store.redo()
    expect(store.currentDocument.colorGrading.enabled).toBe(true)
    expect(store.currentDocument.colorGrading.preset).toBe('warm')

    store.resetColorGrading()
    expect(store.currentDocument.colorGrading.enabled).toBe(false)
    expect(store.currentDocument.colorGrading.preset).toBe('neutral')
  })

  it('réinitialise colorimétrie et shaders dans une seule entrée d’historique', () => {
    const store = useEditorStore()
    store.updateColorGrading({ enabled: true, preset: 'warm', temperature: 18 })
    store.updateShaderSettings({ enabled: true, preset: 'vignette', vignette: 6 })
    store.clearHistory()

    store.resetVisualEffects()

    expect(store.currentDocument.colorGrading).toEqual(DEFAULT_COLOR_GRADING_SETTINGS)
    expect(store.currentDocument.shaderSettings).toEqual(DEFAULT_SHADER_SETTINGS)
    store.undo()
    expect(store.currentDocument.colorGrading).toMatchObject({ enabled: true, preset: 'warm' })
    expect(store.currentDocument.shaderSettings).toMatchObject({ enabled: true, preset: 'vignette' })
    expect(store.canUndo).toBe(false)
  })

  it('persiste et historise une seule fois un geste continu d’effet visuel', async () => {
    const store = useEditorStore()
    vi.mocked(editorDocumentRepository.save).mockClear()

    store.beginGesture('Régler le vignettage')
    store.updateShaderSettings({ enabled: true, preset: 'custom', vignette: 1 })
    store.updateShaderSettings({ vignette: 3 })
    store.updateShaderSettings({ vignette: 6 })
    expect(editorDocumentRepository.save).not.toHaveBeenCalled()
    store.endGesture()
    await store.flushPersistence()

    expect(editorDocumentRepository.save).toHaveBeenCalledTimes(1)
    expect(store.currentDocument.shaderSettings.vignette).toBe(6)
    store.undo()
    expect(store.currentDocument.shaderSettings).toEqual(DEFAULT_SHADER_SETTINGS)
    expect(store.canUndo).toBe(false)
  })
})
