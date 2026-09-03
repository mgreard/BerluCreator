import type { Asset } from '@core/types/asset.types'
import type { RigCatalogFile } from './rig-catalog.types'
import { createDefaultRigConfigurationBundle } from './rig-default-configuration.service'

export const DEFAULT_RIG_CATALOG_MODULE_FILENAME = 'default-rig-catalog.ts'

export function createDefaultRigCatalogModule(
  catalog: RigCatalogFile,
  assets: readonly Asset[] = []
): string {
  const bundle = createDefaultRigConfigurationBundle(catalog, assets)

  return [
    "import type { Asset } from '@core/types/asset.types'",
    "import type { DefaultRigAssetCalibration, DefaultRigConfigurationBundle } from './rig-default-configuration.types'",
    "import type { RigCatalogFile, RigDefinition } from './rig-catalog.types'",
    '',
    '/** Généré depuis le calibreur de rigs. Remplace le fichier homonyme dans rig-calibration. */',
    `export const DEFAULT_RIG_CONFIGURATION_BUNDLE: DefaultRigConfigurationBundle = ${JSON.stringify(bundle, null, 2)}`,
    '',
    'export const DEFAULT_RIG_CATALOG_FILE: RigCatalogFile =',
    '  DEFAULT_RIG_CONFIGURATION_BUNDLE.catalog',
    '',
    'export const DEFAULT_RIG_ASSET_CALIBRATIONS: DefaultRigAssetCalibration[] =',
    '  DEFAULT_RIG_CONFIGURATION_BUNDLE.assetCalibrations',
    '',
    'export function getDefaultRigCatalogFile(): RigCatalogFile {',
    '  return structuredClone(DEFAULT_RIG_CATALOG_FILE)',
    '}',
    '',
    'export function findDefaultRigDefinition(',
    '  characterKey: string,',
    "  body: Pick<Asset, 'name' | 'category' | 'width' | 'height'>",
    '): RigDefinition | undefined {',
    '  return DEFAULT_RIG_CATALOG_FILE.rigs.find(',
    '    (rig) =>',
    '      rig.characterKey === characterKey &&',
    '      rig.body.name === body.name &&',
    '      rig.body.category === body.category &&',
    '      rig.body.width === body.width &&',
    '      rig.body.height === body.height',
    '  )',
    '}',
    ''
  ].join('\n')
}

export function downloadDefaultRigCatalogModule(
  catalog: RigCatalogFile,
  assets: readonly Asset[] = []
): void {
  const source = createDefaultRigCatalogModule(catalog, assets)
  const blob = new Blob([source], { type: 'text/typescript;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = DEFAULT_RIG_CATALOG_MODULE_FILENAME
  document.body.append(anchor)

  try {
    anchor.click()
  } finally {
    anchor.remove()
    URL.revokeObjectURL(url)
  }
}
