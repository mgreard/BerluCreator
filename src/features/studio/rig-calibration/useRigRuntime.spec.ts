import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useRigCatalogStore } from './rig-catalog.store'
import { useRigRuntime } from './useRigRuntime'

vi.mock('@infrastructure/db/repositories/editor-document.repository', () => ({
  editorDocumentRepository: {
    getById: vi.fn(),
    getByProjectId: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined)
  }
}))

function asset(id: string, name: string, category: AssetCategory): Asset {
  return {
    id,
    name,
    category,
    tags: [],
    blobId: `blob-${id}`,
    width: category === 'body' ? 800 : 260,
    height: category === 'body' ? 900 : 309,
    character: { key: 'berlu', name: 'Berlu', form: 'rig' },
    isMovable: false,
    createdAt: 1,
    updatedAt: 1
  }
}

describe('useRigRuntime (v6)', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('remplace un slot dans le rig courant mais change tout le rig pour une pièce externe', () => {
    const assetStore = useAssetStore()
    const editor = useEditorStore()
    const catalog = useRigCatalogStore()
    const bodyA = asset('body-a', 'Corps A', 'body')
    const bodyB = asset('body-b', 'Corps B', 'body')
    const sharedHead = asset('head-shared', 'Tête partagée', 'head')
    const otherHead = asset('head-b', 'Tête B', 'head')
    assetStore.assets = [bodyA, bodyB, sharedHead, otherHead]
    catalog.initialize(assetStore.assets)
    const [rigA, rigB] = catalog.rigs
    catalog.setPartCompatibility(rigA!.id, otherHead, false)
    const runtime = useRigRuntime()

    runtime.activateRig(rigA!)
    const group = editor.currentDocument.groups.find(
      (candidate) => candidate.kind === 'character' && candidate.characterKey === 'berlu'
    )
    expect(group?.kind).toBe('character')
    if (!group || group.kind !== 'character') throw new Error('Groupe personnage introuvable')
    expect(group.activeRigId).toBe(rigA!.id)
    expect(
      editor.currentDocument.layers.find(
        (layer) => layer.groupId === group.id && layer.category === 'body'
      )?.assetId
    ).toBe(bodyA.id)

    runtime.selectCharacterAsset(sharedHead)
    expect(group.activeRigId).toBe(rigA!.id)
    expect(
      editor.currentDocument.layers.filter(
        (layer) => layer.groupId === group.id && layer.category === 'head'
      )
    ).toHaveLength(1)

    runtime.selectCharacterAsset(otherHead)
    expect(group.activeRigId).toBe(rigB!.id)
    expect(
      editor.currentDocument.layers.find(
        (layer) => layer.groupId === group.id && layer.category === 'body'
      )?.assetId
    ).toBe(bodyB.id)
    expect(
      editor.currentDocument.layers.find(
        (layer) => layer.groupId === group.id && layer.category === 'head'
      )?.assetId
    ).toBe(otherHead.id)
  })

  it('omet les pièces des catégories désactivées lors de l’activation d’un rig', () => {
    const assetStore = useAssetStore()
    const editor = useEditorStore()
    const catalog = useRigCatalogStore()
    const body = asset('body-a', 'Corps A', 'body')
    const head = asset('head-1', 'Tête', 'head')
    assetStore.assets = [body, head]
    catalog.initialize(assetStore.assets)
    const [rig] = catalog.rigs

    catalog.setCategoryEnabled(rig!.id, 'head', false)
    const runtime = useRigRuntime()
    runtime.activateRig(rig!)

    const group = editor.currentDocument.groups.find(
      (candidate) => candidate.kind === 'character' && candidate.characterKey === 'berlu'
    )
    expect(group).toBeDefined()

    const layers = editor.currentDocument.layers.filter((l) => l.groupId === group!.id)
    expect(layers.some((l) => l.category === 'body')).toBe(true)
    expect(layers.some((l) => l.category === 'head')).toBe(false)
  })
})
