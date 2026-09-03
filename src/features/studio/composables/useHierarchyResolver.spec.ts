import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Asset } from '@core/types/asset.types'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useHierarchyResolver } from './useHierarchyResolver'
import { resolveStagePlacementZIndexes } from '../engine/stage-layer-placement'
import { useRigCatalogStore } from '../rig-calibration/rig-catalog.store'
import { createBerluHeadSeries } from '../rig-calibration/rig-catalog.service'

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
      asset('full', 'perso', 'full'),
      asset('body', 'body', 'rig'),
      asset('head', 'head', 'rig')
    ]
    const full = editor.assignAssetToGroup('full', 'perso')
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

  it('fait pivoter la tête autour du centre visuel tout en gardant le cou pour l’échelle', () => {
    const editor = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [asset('body', 'body', 'rig'), asset('head', 'head', 'rig', 260, 309)]
    editor.assignAssetToGroup('body', 'body')
    const head = editor.assignAssetToGroup('head', 'head')
    editor.updateLayerTransform(head.id, { x: 210, y: 24, scaleX: 0.5, scaleY: 0.5 })

    const { activeLayers } = useHierarchyResolver()
    const resolved = activeLayers.value.find((layer) => layer.layerId === head.id)!

    expect(resolved.rotationOriginX).toBeCloseTo(
      resolved.transformOriginX +
        (resolved.x + resolved.width / 2 - resolved.transformOriginX) * resolved.scaleX
    )
    expect(resolved.rotationOriginY).toBeCloseTo(
      resolved.transformOriginY +
        (resolved.y + resolved.height / 2 - resolved.transformOriginY) * resolved.scaleY
    )
    expect(resolved.rotationOriginY).not.toBe(resolved.transformOriginY)
  })

  it('convertit les offsets natifs des éléments ancrés avec le baseScale de la scène', () => {
    const editor = useEditorStore()
    const assets = useAssetStore()
    const catalog = useRigCatalogStore()
    const body = asset('body', 'body', 'rig', 840, 908)
    const head = asset('head', 'head', 'rig', 1205, 1305)
    const mouth = asset('mouth', 'mouth', 'rig', 200, 100)
    head.headSeriesId = 'berlu'
    mouth.headSeriesId = 'berlu'
    mouth.anchoredCalibrationBySeries = {
      berlu: {
        pivot: { x: 0.5, y: 0.5 },
        offsetX: 80,
        offsetY: 40,
        scale: 0.6,
        rotation: 5
      }
    }
    catalog.headSeries = [createBerluHeadSeries()]
    assets.assets = [body, head, mouth]
    editor.assignAssetToGroup(body.id, 'body')
    editor.assignAssetToGroup(head.id, 'head', undefined, head.name, {
      x: 420 - head.width / 2,
      y: 120 - head.height / 2,
      scaleX: 0.35,
      scaleY: 0.35,
      rotation: 0
    })
    const mouthLayer = editor.assignAssetToGroup(mouth.id, 'mouth')

    const { activeLayers } = useHierarchyResolver()
    const resolvedHead = activeLayers.value.find((layer) => layer.asset.id === head.id)!
    const resolvedMouth = activeLayers.value.find((layer) => layer.layerId === mouthLayer.id)!
    const series = catalog.headSeries[0]!
    const baseScaleX = resolvedHead.width / head.width
    const baseScaleY = resolvedHead.height / head.height
    const anchorX =
      resolvedHead.transformOriginX +
      (resolvedHead.x + series.mouthAnchor.x * resolvedHead.width -
        resolvedHead.transformOriginX) *
        resolvedHead.scaleX
    const anchorY =
      resolvedHead.transformOriginY +
      (resolvedHead.y + series.mouthAnchor.y * resolvedHead.height -
        resolvedHead.transformOriginY) *
        resolvedHead.scaleY

    expect(resolvedMouth.transformOriginX).toBeCloseTo(
      anchorX + 80 * baseScaleX * resolvedHead.scaleX
    )
    expect(resolvedMouth.transformOriginY).toBeCloseTo(
      anchorY + 40 * baseScaleY * resolvedHead.scaleY
    )
    expect(resolvedMouth.scaleX).toBeCloseTo(resolvedHead.scaleX * 0.6)
    expect(resolvedMouth.rotation).toBe(5)
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

    expect(activeLayers.value[0]).toMatchObject({ depthRole: 'subject', opticalDepth: 0.5 })
    editor.setLayerDepthRole(layer.id, 'background')
    expect(activeLayers.value[0]).toMatchObject({ depthRole: 'background', opticalDepth: 0 })

    editor.setLayerOpticalDepth(layer.id, 0.65)
    expect(activeLayers.value[0]).toMatchObject({ depthRole: 'background', opticalDepth: 0.65 })
  })

  it('résout la distance optique et le rôle de profondeur appliqués à un groupe de personnage', () => {
    const editor = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [asset('body', 'body', 'rig'), asset('head', 'head', 'rig')]
    const group = editor.currentDocument.groups.find((g) => g.kind === 'character')!
    editor.assignAssetToGroup('body', 'body', group.id)
    editor.assignAssetToGroup('head', 'head', group.id)

    editor.setGroupOpticalDepth(group.id, 0.85)
    const { activeLayers } = useHierarchyResolver()
    const characterResolved = activeLayers.value.filter((l) => l.groupId === group.id)
    expect(characterResolved.length).toBeGreaterThan(0)
    for (const l of characterResolved) {
      expect(l.opticalDepth).toBe(0.85)
    }
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

  it('place « Derrière » sous le bureau et tous les personnages dans l’ordre de rendu', () => {
    const editor = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [
      asset('desk', 'desk'),
      asset('prop', 'props_set'),
      asset('berlu-full', 'perso', 'full'),
      asset('pedro-full', 'perso', 'full', 840, 908, 'pedro')
    ]
    const desk = editor.assignAssetToGroup('desk', 'desk')
    const prop = editor.assignAssetToGroup('prop', 'props_set')
    const berlu = editor.assignAssetToGroup('berlu-full', 'perso')
    const pedro = editor.assignAssetToGroup('pedro-full', 'perso')
    const { activeLayers } = useHierarchyResolver()

    expect(activeLayers.value.at(-1)?.layerId).toBe(prop.id)

    const placement = resolveStagePlacementZIndexes(
      desk.zIndex,
      editor.currentDocument.groups
    )
    editor.updateLayer(prop.id, { stagePlane: 'rear', zIndex: placement.behind })
    const behindOrder = activeLayers.value.map((layer) => layer.layerId)
    expect(behindOrder.indexOf(prop.id)).toBeLessThan(behindOrder.indexOf(desk.id))
    expect(behindOrder.indexOf(prop.id)).toBeLessThan(behindOrder.indexOf(berlu.id))
    expect(behindOrder.indexOf(prop.id)).toBeLessThan(behindOrder.indexOf(pedro.id))

    editor.undo()
    expect(activeLayers.value.at(-1)?.layerId).toBe(prop.id)

    editor.redo()
    expect(activeLayers.value[0]?.layerId).toBe(prop.id)
  })

  it('conserve toujours le foreground devant un personnage ajouté dynamiquement', () => {
    const editor = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [
      asset('flowers', 'foreground'),
      asset('pedro-full', 'perso', 'full', 840, 908, 'pedro')
    ]
    const foreground = editor.assignAssetToGroup('flowers', 'foreground')
    const character = editor.assignAssetToGroup('pedro-full', 'perso')
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
      depthRole: 'subject',
      opticalDepth: 0.5
    })

    editor.setLayerOpticalDepth(foreground.id, 0.65)
    expect(activeLayers.value.at(-1)).toMatchObject({
      layerId: foreground.id,
      category: 'foreground',
      depthRole: 'subject',
      opticalDepth: 0.65
    })
  })

  it('adapte les dimensions au ratio naturel de la représentation active', () => {
    const editor = useEditorStore()
    const assets = useAssetStore()
    assets.assets = [
      asset('full', 'perso', 'full', 1200, 600),
      asset('body', 'body', 'rig', 600, 900)
    ]
    const full = editor.assignAssetToGroup('full', 'perso')
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

  it('scinde un bureau configuré en 2 sous-calques prenant le personnage en sandwich', () => {
    const editor = useEditorStore()
    const assets = useAssetStore()
    const deskAsset = asset('pool', 'desk', undefined, 1000, 500)
    deskAsset.deskSplit = {
      enabled: true,
      cutline: [
        { x: 0, y: 0.5 },
        { x: 1, y: 0.5 }
      ]
    }
    assets.assets = [deskAsset, asset('char', 'perso', 'full', 400, 600)]

    const charLayer = editor.assignAssetToGroup('char', 'perso')
    const deskLayer = editor.assignAssetToGroup('pool', 'desk')

    const { activeLayers } = useHierarchyResolver()
    expect(activeLayers.value).toHaveLength(3)

    const deskBack = activeLayers.value.find((l) => l.id === `${deskLayer.id}__back`)
    const char = activeLayers.value.find((l) => l.id === charLayer.id)
    const deskFront = activeLayers.value.find((l) => l.id === `${deskLayer.id}__front`)

    expect(deskBack).toBeDefined()
    expect(char).toBeDefined()
    expect(deskFront).toBeDefined()

    expect(deskBack?.splitRole).toBe('back')
    expect(deskFront?.splitRole).toBe('front')
    expect(deskBack?.clipPolygon).toBeDefined()
    expect(deskFront?.clipPolygon).toBeDefined()

    // Ordre de rendu dans activeLayers : desk_back -> character -> desk_front
    const backIndex = activeLayers.value.indexOf(deskBack!)
    const charIndex = activeLayers.value.indexOf(char!)
    const frontIndex = activeLayers.value.indexOf(deskFront!)

    expect(backIndex).toBeLessThan(charIndex)
    expect(charIndex).toBeLessThan(frontIndex)
  })

  it('aligne l’origine de transformation d’un calque arrière-plan sur le coin supérieur gauche clampé', () => {
    const editor = useEditorStore()
    const assets = useAssetStore()
    const bgAsset = asset('bg-1', 'background', undefined, 2400, 1350)
    assets.assets = [bgAsset]
    editor.assignAssetToGroup('bg-1', 'background')

    const { activeLayers } = useHierarchyResolver()
    expect(activeLayers.value).toHaveLength(1)
    const resolved = activeLayers.value[0]!

    expect(resolved.x).toBe(0)
    expect(resolved.y).toBe(0)
    expect(resolved.transformOriginX).toBe(resolved.x)
    expect(resolved.transformOriginY).toBe(resolved.y)
  })
})
