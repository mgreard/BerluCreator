import type { AssetBlobRecord } from '@core/types/asset.types'
import type { WorkspaceSnapshot } from '@core/types/project.types'
import { parseRigCatalogFile } from '@/features/studio/rig-calibration/rig-catalog.service'

export const WORKSPACE_BACKUP_FILE_SCHEMA = 'berlu-creator/workspace-backup' as const
export const WORKSPACE_BACKUP_FILE_VERSION = 1 as const

interface SerializedAssetBlobRecord extends Omit<AssetBlobRecord, 'data'> {
  dataBase64: string
}

interface WorkspaceBackupFile {
  schema: typeof WORKSPACE_BACKUP_FILE_SCHEMA
  version: typeof WORKSPACE_BACKUP_FILE_VERSION
  exportedAt: string
  workspace: Omit<WorkspaceSnapshot, 'id' | 'schemaVersion' | 'assetBlobs' | 'rigCatalogJson'> & {
    assetBlobs: SerializedAssetBlobRecord[]
  }
  rigCatalog: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireArray(record: Record<string, unknown>, key: string): unknown[] {
  const value = record[key]
  if (!Array.isArray(value))
    throw new Error(`Sauvegarde invalide : « ${key} » doit être une liste.`)
  return value
}

function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  if (typeof value !== 'string' || !value) {
    throw new Error(`Sauvegarde invalide : « ${key} » est absent.`)
  }
  return value
}

function requireFiniteNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Sauvegarde invalide : « ${key} » doit être un nombre.`)
  }
  return value
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('Lecture du blob impossible.'))
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Encodage du blob impossible.'))
        return
      }
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(value: string, mimeType: string): Blob {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 !== 0) {
    throw new Error('Sauvegarde invalide : contenu binaire mal encodé.')
  }

  let decoded: string
  try {
    decoded = atob(value)
  } catch {
    throw new Error('Sauvegarde invalide : contenu binaire mal encodé.')
  }
  const bytes = new Uint8Array(decoded.length)
  for (let index = 0; index < decoded.length; index += 1) bytes[index] = decoded.charCodeAt(index)
  return new Blob([bytes], { type: mimeType })
}

async function serializeBlob(record: AssetBlobRecord): Promise<SerializedAssetBlobRecord> {
  if (!(record.data instanceof Blob) || record.data.size !== record.size) {
    throw new Error(`Le blob « ${record.id} » est incomplet et ne peut pas être exporté.`)
  }
  return {
    id: record.id,
    mimeType: record.mimeType,
    size: record.size,
    createdAt: record.createdAt,
    dataBase64: await blobToBase64(record.data)
  }
}

function parseBlob(value: unknown): AssetBlobRecord {
  if (!isRecord(value)) throw new Error('Sauvegarde invalide : blob illisible.')
  const id = requireString(value, 'id')
  const mimeType = requireString(value, 'mimeType')
  const expectedSize = requireFiniteNumber(value, 'size')
  const createdAt = requireFiniteNumber(value, 'createdAt')
  const data = base64ToBlob(requireString(value, 'dataBase64'), mimeType)
  if (data.size !== expectedSize) {
    throw new Error(`Sauvegarde invalide : taille incorrecte pour le blob « ${id} ».`)
  }
  return { id, mimeType, size: expectedSize, createdAt, data }
}

export async function serializeWorkspaceBackupFile(snapshot: WorkspaceSnapshot): Promise<string> {
  if (!snapshot.rigCatalogJson) {
    throw new Error('Le catalogue de rigs est absent de la sauvegarde.')
  }
  const rigCatalog = parseRigCatalogFile(snapshot.rigCatalogJson)
  const assetBlobs = await Promise.all(snapshot.assetBlobs.map(serializeBlob))
  const file: WorkspaceBackupFile = {
    schema: WORKSPACE_BACKUP_FILE_SCHEMA,
    version: WORKSPACE_BACKUP_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    workspace: {
      activeProjectId: snapshot.activeProjectId,
      createdAt: snapshot.createdAt,
      projects: snapshot.projects,
      editorDocuments: snapshot.editorDocuments,
      viewportSnapshots: snapshot.viewportSnapshots,
      assets: snapshot.assets,
      assetBlobs
    },
    rigCatalog
  }
  return JSON.stringify(file)
}

export function workspaceBackupFilename(date = new Date()): string {
  const timestamp = date
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\.\d{3}Z$/, 'Z')
  return `berlu-studio-backup-${timestamp}.json`
}

export function parseWorkspaceBackupFile(raw: string): WorkspaceSnapshot {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Le fichier de sauvegarde ne contient pas de JSON valide.')
  }
  if (!isRecord(parsed)) throw new Error('Le fichier de sauvegarde est invalide.')
  if (parsed.schema !== WORKSPACE_BACKUP_FILE_SCHEMA) {
    throw new Error('Ce fichier n’est pas une sauvegarde complète de Berlu Studio.')
  }
  if (parsed.version !== WORKSPACE_BACKUP_FILE_VERSION) {
    throw new Error(`Version de fichier non prise en charge : ${String(parsed.version)}`)
  }
  if (!isRecord(parsed.workspace))
    throw new Error('Sauvegarde invalide : espace de travail absent.')

  const workspace = parsed.workspace
  const rigCatalogJson = JSON.stringify(parseRigCatalogFile(JSON.stringify(parsed.rigCatalog)))
  const snapshot: WorkspaceSnapshot = {
    id: 'manual',
    schemaVersion: 5,
    activeProjectId: requireString(workspace, 'activeProjectId'),
    createdAt: requireFiniteNumber(workspace, 'createdAt'),
    projects: requireArray(workspace, 'projects') as WorkspaceSnapshot['projects'],
    editorDocuments: requireArray(
      workspace,
      'editorDocuments'
    ) as WorkspaceSnapshot['editorDocuments'],
    viewportSnapshots: requireArray(
      workspace,
      'viewportSnapshots'
    ) as WorkspaceSnapshot['viewportSnapshots'],
    assets: requireArray(workspace, 'assets') as WorkspaceSnapshot['assets'],
    assetBlobs: requireArray(workspace, 'assetBlobs').map(parseBlob),
    rigCatalogJson
  }
  const activeProject = snapshot.projects.find(
    (project) => isRecord(project) && project.id === snapshot.activeProjectId
  )
  if (!activeProject) {
    throw new Error('Sauvegarde invalide : le projet actif est absent.')
  }
  if (
    typeof activeProject.editorDocumentId !== 'string' ||
    !snapshot.editorDocuments.some(
      (document) => isRecord(document) && document.id === activeProject.editorDocumentId
    )
  ) {
    throw new Error('Sauvegarde invalide : le document actif est absent.')
  }
  return snapshot
}
