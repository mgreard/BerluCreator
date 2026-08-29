import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Asset } from '@core/types/asset.types'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useHierarchyResolver } from './useHierarchyResolver'

vi.mock('@infrastructure/db/repositories/editor-document.repository', () => ({
  editorDocumentRepository: {
    getById: vi.fn(),
    getByProjectId: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined)
  }
}))

function asset(
  id: string,
  category: Asset['category'],
  form?: 'full' | 'rig',
  width = 840,
  height = 908,
  characterKey = 'berlu'
): Asset {
  return {
    id,
    name: id,
    category,
    tags: [],
    blobId: `blob-${id}`,
    width,
    height,
    character: form
      ? { key: characterKey, name: characterKey === 'berlu' ? 'Berlu' : 'Pedro', form }
      : undefined,
    isMovable: !form,
    createdAt: 1,
    updatedAt: 1
  }
}

describe('useHierarchyResolver', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('rend seulement la représentation active du personnage', () => {
    const editor = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [
      asset('full', 'character_full', 'full'),
      asset('body', 'body', 'rig'),
      asset('head', 'head', 'rig')
    ]
    const full = editor.assignAssetToGroup('full', 'character_full')
    const body = editor.assignAssetToGroup('body', 'body')
    const head = editor.assignAssetToGroup('head', 'head')
    const { activeLayers } = useHierarchyResolver()
    expect(activeLayers.value.map((layer) => layer.layerId)).toEqual([body.id, head.id])
    editor.setCharacterMode(body.groupId, 'full')
    expect(activeLayers.value.map((layer) => layer.layerId)).toEqual([full.id])
  })

  it('déplace tout le personnage avec le transform de son groupe', () => {
    const editor = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [asset('body', 'body', 'rig'), asset('head', 'head', 'rig')]
    const body = editor.assignAssetToGroup('body', 'body')
    const head = editor.assignAssetToGroup('head', 'head')
    const { activeLayers } = useHierarchyResolver()
    const before = activeLayers.value.map((layer) => ({ id: layer.id, x: layer.x, y: layer.y }))
    editor.updateGroupTransform(body.groupId, { x: 100, y: 50 })
    for (const layer of activeLayers.value.filter(
      (item) => item.id === body.id || item.id === head.id
    )) {
      const initial = before.find((item) => item.id === layer.id)!
      expect(layer.x).toBe(initial.x + 100)
      expect(layer.y).toBe(initial.y + 50)
    }
  })

  it('exclut les calques et groupes masqués du rendu', () => {
    const editor = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [asset('prop', 'props_set')]
    const layer = editor.assignAssetToGroup('prop', 'props_set')
    const { activeLayers } = useHierarchyResolver()
    expect(activeLayers.value).toHaveLength(1)
    editor.setLayerMuted(layer.id, true)
    expect(activeLayers.value).toHaveLength(0)
  })

  it('résout automatiquement le plan net des accessoires et accepte le plan décor', () => {
    const editor = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [asset('prop', 'props_set')]
    const layer = editor.assignAssetToGroup('prop', 'props_set')
    const { activeLayers } = useHierarchyResolver()

    expect(activeLayers.value[0]?.depthRole).toBe('subject')
    editor.setLayerDepthRole(layer.id, 'background')
    expect(activeLayers.value[0]?.depthRole).toBe('background')
  })

  it('conserve le rôle optique indépendant de l’ordre de rendu et de hit-test', () => {
    const editor = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [asset('desk', 'desk'), asset('prop', 'props_set')]
    const desk = editor.assignAssetToGroup('desk', 'desk')
    const prop = editor.assignAssetToGroup('prop', 'props_set')
    const { activeLayers } = useHierarchyResolver()

    expect(activeLayers.value.map((layer) => layer.layerId)).toEqual([desk.id, prop.id])
    editor.setLayerDepthRole(prop.id, 'background')
    expect(activeLayers.value.map((layer) => layer.layerId)).toEqual([desk.id, prop.id])
    expect(activeLayers.value.find((layer) => layer.layerId === prop.id)?.depthRole).toBe(
      'background'
    )
  })

  it('place individuellement un accessoire devant ou derrière le bureau selon son z-index', () => {
    const editor = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [asset('desk', 'desk'), asset('prop', 'props_set')]
    const desk = editor.assignAssetToGroup('desk', 'desk')
    const prop = editor.assignAssetToGroup('prop', 'props_set')
    const { activeLayers } = useHierarchyResolver()

    expect(activeLayers.value.map((layer) => layer.layerId)).toEqual([desk.id, prop.id])

    editor.updateLayerZIndex(prop.id, desk.zIndex - 1)
    expect(activeLayers.value.map((layer) => layer.layerId)).toEqual([prop.id, desk.id])

    editor.undo()
    expect(activeLayers.value.map((layer) => layer.layerId)).toEqual([desk.id, prop.id])

    editor.redo()
    expect(activeLayers.value.map((layer) => layer.layerId)).toEqual([prop.id, desk.id])
  })

  it('conserve toujours le foreground devant un personnage ajouté dynamiquement', () => {
    const editor = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [
      asset('flowers', 'foreground'),
      asset('pedro-full', 'character_full', 'full', 840, 908, 'pedro')
    ]
    const foreground = editor.assignAssetToGroup('flowers', 'foreground')
    const character = editor.assignAssetToGroup('pedro-full', 'character_full')
    const { activeLayers } = useHierarchyResolver()

    expect(
      activeLayers.value.find((layer) => layer.layerId === character.id)?.groupZIndex
    ).toBeGreaterThan(
      activeLayers.value.find((layer) => layer.layerId === foreground.id)!.groupZIndex
    )
    expect(activeLayers.value.at(-1)?.layerId).toBe(foreground.id)

    editor.setLayerDepthRole(foreground.id, 'background')
    expect(activeLayers.value.at(-1)).toMatchObject({
      layerId: foreground.id,
      category: 'foreground',
      depthRole: 'subject'
    })
  })

  it('adapte les dimensions au ratio naturel de la représentation active', () => {
    const editor = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [
      asset('full', 'character_full', 'full', 1200, 600),
      asset('body', 'body', 'rig', 600, 900)
    ]
    const full = editor.assignAssetToGroup('full', 'character_full')
    const body = editor.assignAssetToGroup('body', 'body')
    const { activeLayers } = useHierarchyResolver()

    expect(activeLayers.value[0].layerId).toBe(body.id)
    expect(activeLayers.value[0].width / activeLayers.value[0].height).toBeCloseTo(2 / 3)

    editor.setCharacterMode(full.groupId, 'full')
    expect(activeLayers.value[0].layerId).toBe(full.id)
    expect(activeLayers.value[0].width / activeLayers.value[0].height).toBeCloseTo(2)
  })

  it('ne déplace pas la tête quand le corps actif change de dimensions', () => {
    const editor = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [
      asset('bust', 'body', 'rig', 424, 838),
      asset('full-body', 'body', 'rig', 1031, 812),
      asset('head', 'head', 'rig', 260, 309)
    ]
    editor.assignAssetToGroup('bust', 'body')
    const head = editor.assignAssetToGroup('head', 'head')
    editor.updateLayerTransform(head.id, { x: 210, y: 24, scaleX: 0.8, scaleY: 0.8 })
    const { activeLayers } = useHierarchyResolver()
    const before = activeLayers.value.find((layer) => layer.layerId === head.id)!

    editor.assignAssetToGroup('full-body', 'body')
    const after = activeLayers.value.find((layer) => layer.layerId === head.id)!

    expect({ x: after.x, y: after.y, width: after.width, height: after.height }).toEqual({
      x: before.x,
      y: before.y,
      width: before.width,
      height: before.height
    })
  })

  it('rend déplaçable un ancien bureau persisté comme non mobile', () => {
    const editor = useEditorStore()
    const assets = useAssetStore()
    const legacyDesk = asset('desk', 'desk', undefined, 1792, 1024)
    legacyDesk.isMovable = false
    assets.assets = [legacyDesk]
    editor.assignAssetToGroup('desk', 'desk')

    const { activeLayers } = useHierarchyResolver()
    expect(activeLayers.value[0]).toMatchObject({ category: 'desk', isMovable: true })
  })
})
