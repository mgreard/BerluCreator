import type { Asset } from '@core/types/asset.types'
import { createBerluHeadSeries } from './rig-catalog.service'
import {
  RIG_CATALOG_SCHEMA,
  RIG_CATALOG_VERSION,
  type RigCatalogFile,
  type RigDefinition
} from './rig-catalog.types'

export const DEFAULT_RIG_CATALOG_FILE: RigCatalogFile = {
  schema: RIG_CATALOG_SCHEMA,
  version: RIG_CATALOG_VERSION,
  exportedAt: new Date(0).toISOString(),
  defaultRigByCharacter: {},
  headSeries: [createBerluHeadSeries()],
  rigs: []
}

export function getDefaultRigCatalogFile(): RigCatalogFile {
  return structuredClone(DEFAULT_RIG_CATALOG_FILE)
}

export function findDefaultRigDefinition(
  characterKey: string,
  body: Pick<Asset, 'name' | 'category' | 'width' | 'height'>
): RigDefinition | undefined {
  void characterKey
  void body
  return undefined
}
