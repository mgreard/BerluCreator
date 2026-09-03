import { describe, expect, it, vi } from 'vitest'
import { createBerluHeadSeries, createRigCatalogFile, createRigDefinition } from './rig-catalog.service'
import {
  createDefaultRigCatalogModule,
  DEFAULT_RIG_CATALOG_MODULE_FILENAME,
  downloadDefaultRigCatalogModule
} from './rig-catalog-code-export'
import type { Asset } from '@core/types/asset.types'

function bodyAsset(): Asset {
  return {
    id: 'body-1',
    name: 'Corps principal',
    category: 'body',
    tags: [],
    blobId: 'blob-body-1',
    width: 800,
    height: 1000,
    character: { key: 'berlu', name: 'Berlu', form: 'rig' },
    isMovable: false,
    createdAt: 1,
    updatedAt: 1
  }
}

function catalog() {
  const rig = createRigDefinition(bodyAsset())
  rig.headSeries = [
    {
      seriesId: 'berlu',
      enabled: true,
      defaultScale: 0.5,
      defaultRotation: 8,
      defaultHeadAssetKey: 'head:berlu:neutre'
    }
  ]

  return createRigCatalogFile([rig], { berlu: rig.id }, [createBerluHeadSeries()])
}

describe('export du catalogue de rigs pour le code', () => {
  it('génère un module TypeScript complet et stable', () => {
    const source = createDefaultRigCatalogModule(catalog())
    const serializedCatalog = source
      .slice(source.indexOf(' = ') + 3, source.indexOf('\n\nexport function'))
      .trim()

    expect(source).toContain("import type { Asset } from '@core/types/asset.types'")
    expect(source).toContain("import type { RigCatalogFile, RigDefinition } from './rig-catalog.types'")
    expect(source).toContain('export const DEFAULT_RIG_CATALOG_FILE: RigCatalogFile =')
    expect(source).toContain('export function getDefaultRigCatalogFile(): RigCatalogFile')
    expect(source).toContain('export function findDefaultRigDefinition(')
    expect(JSON.parse(serializedCatalog)).toMatchObject({
      exportedAt: '1970-01-01T00:00:00.000Z',
      defaultRigByCharacter: { berlu: expect.any(String) },
      headSeries: [{ id: 'berlu' }],
      rigs: [
        {
          name: 'Corps principal',
          headSeries: [
            {
              enabled: true,
              defaultScale: 0.5,
              defaultRotation: 8,
              defaultHeadAssetKey: 'head:berlu:neutre'
            }
          ]
        }
      ]
    })
  })

  it('télécharge le module avec un nom directement identifiable', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click')

    downloadDefaultRigCatalogModule(catalog())

    expect(click).toHaveBeenCalledOnce()
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:vitest')
    expect(document.querySelector('a')).toBeNull()
    expect(DEFAULT_RIG_CATALOG_MODULE_FILENAME).toBe('default-rig-catalog.ts')
  })
})
