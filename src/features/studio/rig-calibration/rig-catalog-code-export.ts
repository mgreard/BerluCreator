import type { RigCatalogFile } from './rig-catalog.types'

export const DEFAULT_RIG_CATALOG_MODULE_FILENAME = 'default-rig-catalog.ts'

const DEFAULT_CATALOG_EXPORTED_AT = new Date(0).toISOString()

export function createDefaultRigCatalogModule(catalog: RigCatalogFile): string {
  const defaultCatalog: RigCatalogFile = {
    ...structuredClone(catalog),
    exportedAt: DEFAULT_CATALOG_EXPORTED_AT
  }

  return [
    "import type { Asset } from '@core/types/asset.types'",
    "import type { RigCatalogFile, RigDefinition } from './rig-catalog.types'",
    '',
    '/** Généré depuis le calibreur de rigs. Remplace le fichier homonyme dans rig-calibration. */',
    `export const DEFAULT_RIG_CATALOG_FILE: RigCatalogFile = ${JSON.stringify(defaultCatalog, null, 2)}`,
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

export function downloadDefaultRigCatalogModule(catalog: RigCatalogFile): void {
  const source = createDefaultRigCatalogModule(catalog)
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
