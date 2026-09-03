import type { Asset } from '@core/types/asset.types'
import { createBerluHeadSeries } from './rig-catalog.service'
import {
  DEFAULT_RIG_CONFIGURATION_SCHEMA,
  DEFAULT_RIG_CONFIGURATION_VERSION,
  type DefaultRigAssetCalibration,
  type DefaultRigConfigurationBundle
} from './rig-default-configuration.types'
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

export const DEFAULT_RIG_ASSET_CALIBRATIONS: DefaultRigAssetCalibration[] = []

export const DEFAULT_RIG_CONFIGURATION_BUNDLE: DefaultRigConfigurationBundle = {
  schema: DEFAULT_RIG_CONFIGURATION_SCHEMA,
  version: DEFAULT_RIG_CONFIGURATION_VERSION,
  exportedAt: new Date(0).toISOString(),
  catalog: DEFAULT_RIG_CATALOG_FILE,
  assetCalibrations: DEFAULT_RIG_ASSET_CALIBRATIONS
}

export function getDefaultRigCatalogFile(): RigCatalogFile {
  return structuredClone(DEFAULT_RIG_CATALOG_FILE)
}

export function findDefaultRigDefinition(
  characterKey: string,
  body: Pick<Asset, 'name' | 'category' | 'width' | 'height'>
): RigDefinition | undefined {
  return DEFAULT_RIG_CATALOG_FILE.rigs.find(
    (rig) =>
      rig.characterKey === characterKey &&
      rig.body.name === body.name &&
      rig.body.category === body.category &&
      rig.body.width === body.width &&
      rig.body.height === body.height
  )
}
