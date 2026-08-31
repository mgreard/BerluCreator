import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBatchExporter } from './useBatchExporter'
import { useAssetStore } from '../stores/useAssetStore'
import { useRigCatalogStore } from '@/features/studio/rig-calibration/rig-catalog.store'

describe('useBatchExporter', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('fournit la liste des éléments exportables à partir des assets et des rigs', () => {
    const assetStore = useAssetStore()
    const rigCatalog = useRigCatalogStore()

    assetStore.assets = [
      {
        id: 'asset_1',
        name: 'Fond Studio',
        category: 'background',
        tags: [],
        blobId: 'blob_1',
        width: 1920,
        height: 1080,
        isMovable: false,
        createdAt: 100,
        updatedAt: 100
      }
    ]

    rigCatalog.rigs = [
      {
        id: 'rig_1',
        characterKey: 'incroyable',
        body: { category: 'body', name: 'corps_incroyable' },
        categories: [],
        parts: [],
        excludedPartKeys: [],
        bodyCalibration: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
        createdAt: 100,
        updatedAt: 100
      }
    ]

    const { exportableItems } = useBatchExporter()

    expect(exportableItems.value).toHaveLength(2)
    expect(exportableItems.value[0]).toMatchObject({
      id: 'asset_asset_1',
      type: 'asset',
      name: 'Fond Studio',
      category: 'background',
      width: 1920,
      height: 1080
    })

    expect(exportableItems.value[1]).toMatchObject({
      id: 'rig_rig_1',
      type: 'rig',
      characterKey: 'incroyable'
    })
  })

  it('génère des déclinaisons pour chaque tête compatible du personnage', () => {
    const assetStore = useAssetStore()
    const rigCatalog = useRigCatalogStore()

    const bodyAsset = {
      id: 'body_1',
      name: 'Torse',
      category: 'body' as const,
      character: { key: 'berlu', name: 'Berlu' },
      tags: [],
      blobId: 'blob_body',
      width: 500,
      height: 800,
      isMovable: false,
      createdAt: 100,
      updatedAt: 100
    }

    const head1 = {
      id: 'head_1',
      name: 'Tête Sourire',
      category: 'head' as const,
      character: { key: 'berlu', name: 'Berlu' },
      tags: [],
      blobId: 'blob_head_1',
      width: 250,
      height: 250,
      isMovable: false,
      createdAt: 100,
      updatedAt: 100
    }

    const head2 = {
      id: 'head_2',
      name: 'Tête Clin d’œil',
      category: 'head' as const,
      character: { key: 'berlu', name: 'Berlu' },
      tags: [],
      blobId: 'blob_head_2',
      width: 250,
      height: 250,
      isMovable: false,
      createdAt: 100,
      updatedAt: 100
    }

    assetStore.assets = [bodyAsset, head1, head2]

    rigCatalog.rigs = [
      {
        id: 'rig_berlu',
        characterKey: 'berlu',
        body: { category: 'body', name: 'Torse', width: 500, height: 800 },
        categories: [{ category: 'head', enabled: true }],
        parts: [],
        excludedPartKeys: [],
        bodyOrigin: { x: 250, y: 300 },
        bodyCalibration: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
        createdAt: 100,
        updatedAt: 100
      }
    ]

    const { exportableItems } = useBatchExporter()

    // 3 assets individuels + 2 variations de rig (1 par tête)
    expect(exportableItems.value).toHaveLength(5)

    const rigItems = exportableItems.value.filter((i) => i.type === 'rig')
    expect(rigItems).toHaveLength(2)
    expect(rigItems[0]).toMatchObject({
      id: 'rig_rig_berlu_head_head_1',
      name: 'Rig Berlu - Torse (Tête Sourire)'
    })
    expect(rigItems[1]).toMatchObject({
      id: 'rig_rig_berlu_head_head_2',
      name: 'Rig Berlu - Torse (Tête Clin d’œil)'
    })
  })
})
