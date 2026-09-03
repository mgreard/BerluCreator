import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Asset } from '@core/types/asset.types'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { headCalibration } from './rig-catalog.service'
import { useRigCatalogStore } from './rig-catalog.store'
import { useRigRuntime } from './useRigRuntime'

vi.mock('@infrastructure/db/repositories/editor-document.repository', () => ({
  editorDocumentRepository: {
    getById: vi.fn(), getByProjectId: vi.fn().mockResolvedValue([]), save: vi.fn().mockResolvedValue(undefined)
  }
}))

function asset(
  id: string,
  category: Asset['category'],
  series?: string,
  characterPropSlot?: Asset['characterPropSlot']
): Asset {
  const isBody = category === 'body'
  const isBerlu = series === 'berlu'
  return {
    id, name: id, category, tags: [], blobId: `blob-${id}`,
    width: isBody ? 800 : isBerlu ? 1205 : 900,
    height: isBody ? 1000 : isBerlu ? 1305 : 1000,
    headSeriesId: series,
    characterPropSlot,
    character: { key: 'berlu', name: 'Berlu', form: 'rig' },
    isMovable: false, createdAt: 1, updatedAt: 1
  }
}

describe('useRigRuntime v7', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('preserves the complete instance pose when switching inside one series', () => {
    const assets = useAssetStore()
    const editor = useEditorStore()
    const catalog = useRigCatalogStore()
    const body = asset('body', 'body')
    const first = asset('first', 'head', 'berlu')
    const second = asset('second', 'head', 'berlu')
    assets.assets = [body, first, second]
    catalog.initialize(assets.assets)
    const rig = catalog.rigs[0]!
    catalog.setSeriesCompatibility(rig.id, 'berlu', true)
    const runtime = useRigRuntime()
    runtime.activateRig(rig, first)
    const head = editor.currentDocument.layers.find((layer) => layer.category === 'head')!
    editor.updateLayerTransform(head.id, { x: head.transform.x + 18, y: head.transform.y - 9, scaleX: 0.7, scaleY: 0.7, rotation: 14 })

    const switched = runtime.selectCharacterAsset(second)!
    expect(switched.transform).toMatchObject({ x: head.transform.x, y: head.transform.y, scaleX: 0.7, scaleY: 0.7, rotation: 14 })
  })

  it('keeps neck offset but applies new-series defaults and removes the previous mouth', () => {
    const assets = useAssetStore()
    const editor = useEditorStore()
    const catalog = useRigCatalogStore()
    const body = asset('body', 'body')
    const berluHead = asset('berlu-head', 'head', 'berlu')
    const berluMouth = asset('berlu-mouth', 'mouth', 'berlu')
    const pedroHead = asset('pedro-head', 'head', 'pedro')
    assets.assets = [body, berluHead, berluMouth, pedroHead]
    catalog.initialize(assets.assets)
    const rig = catalog.rigs[0]!
    catalog.setSeriesCompatibility(rig.id, 'berlu', true)
    catalog.setSeriesCompatibility(rig.id, 'pedro', true)
    catalog.updateSeriesDefaults(rig.id, 'pedro', { defaultScale: 0.3, defaultRotation: 11 })
    const runtime = useRigRuntime()
    runtime.activateRig(rig, berluHead)
    runtime.selectCharacterAsset(berluMouth)
    const current = editor.currentDocument.layers.find((layer) => layer.category === 'head')!
    const currentBase = headCalibration(rig, catalog.seriesById('berlu')!, berluHead)!
    editor.updateLayerTransform(current.id, { x: currentBase.x + 20, y: currentBase.y - 12 })

    const next = runtime.selectCharacterAsset(pedroHead)!
    const nextBase = headCalibration(rig, catalog.seriesById('pedro')!, pedroHead)!
    expect(next.transform).toMatchObject({ x: nextBase.x + 20, y: nextBase.y - 12, scaleX: 0.3, scaleY: 0.3, rotation: 11 })
    expect(editor.currentDocument.layers.some((layer) => layer.category === 'mouth')).toBe(false)
  })

  it('conserve la tête, la bouche et les accessoires compatibles lors du changement de corps', () => {
    const assets = useAssetStore()
    const editor = useEditorStore()
    const catalog = useRigCatalogStore()
    const firstBody = asset('body-a', 'body')
    const secondBody = { ...asset('body-b', 'body'), width: 720, height: 940 }
    const head = asset('head', 'head', 'berlu')
    const mouth = asset('mouth', 'mouth', 'berlu')
    const glasses = asset('glasses', 'props_character', undefined, 'sunglass')
    const hat = asset('hat', 'props_character', undefined, 'hat')
    assets.assets = [firstBody, secondBody, head, mouth, glasses, hat]
    catalog.initialize(assets.assets)
    const [firstRig, secondRig] = catalog.rigs
    catalog.setSeriesCompatibility(firstRig!.id, 'berlu', true)
    catalog.setSeriesCompatibility(secondRig!.id, 'berlu', true)
    const runtime = useRigRuntime()
    runtime.activateRig(firstRig!, head)
    runtime.selectCharacterAsset(mouth)
    runtime.selectCharacterAsset(glasses)
    runtime.selectCharacterAsset(hat)

    runtime.selectCharacterAsset(secondBody)

    const activeLayers = editor.currentDocument.layers.filter(
      (layer) => layer.groupId === editor.selectedGroupId && !layer.muted
    )
    expect(activeLayers.map((layer) => layer.assetId)).toEqual(
      expect.arrayContaining(['body-b', 'head', 'mouth', 'glasses', 'hat'])
    )
    expect(activeLayers.filter((layer) => layer.category === 'body')).toHaveLength(1)
    expect(editor.selectedGroup).toMatchObject({ activeRigId: secondRig!.id })
  })

  it('retire les éléments incompatibles avec le rig du nouveau corps', () => {
    const assets = useAssetStore()
    const editor = useEditorStore()
    const catalog = useRigCatalogStore()
    const firstBody = asset('body-a', 'body', 'berlu')
    const secondBody = {
      ...asset('body-b', 'body', 'pedro'),
      width: 720,
      height: 940,
      character: { key: 'berlu', name: 'Berlu', form: 'rig' as const }
    }
    const berluHead = asset('berlu-head', 'head', 'berlu')
    const berluMouth = asset('berlu-mouth', 'mouth', 'berlu')
    const pedroHead = asset('pedro-head', 'head', 'pedro')
    assets.assets = [firstBody, secondBody, berluHead, berluMouth, pedroHead]
    catalog.initialize(assets.assets)
    const [firstRig, secondRig] = catalog.rigs
    catalog.setSeriesCompatibility(firstRig!.id, 'berlu', true)
    catalog.setSeriesCompatibility(secondRig!.id, 'berlu', false)
    catalog.setSeriesCompatibility(secondRig!.id, 'pedro', true)
    const runtime = useRigRuntime()
    runtime.activateRig(firstRig!, berluHead)
    runtime.selectCharacterAsset(berluMouth)

    runtime.selectCharacterAsset(secondBody)

    expect(editor.currentDocument.layers.some((layer) => layer.assetId === 'berlu-head')).toBe(false)
    expect(editor.currentDocument.layers.some((layer) => layer.assetId === 'berlu-mouth')).toBe(false)
    expect(editor.currentDocument.layers.some((layer) => layer.assetId === 'pedro-head')).toBe(true)
  })
})
