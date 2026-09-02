import type { WorkspaceSnapshot, WorkspaceSnapshotSummary } from '@core/types/project.types'
import { db } from '@infrastructure/db/dexie'
import { parseRigCatalogFile } from '@/features/studio/rig-calibration/rig-catalog.service'
import { RIG_CATALOG_STORAGE_KEY } from '@/features/studio/rig-calibration/rig-catalog.types'

const MANUAL_SNAPSHOT_ID = 'manual' as const
type SnapshotComparison = 'no_snapshot' | 'saved' | 'dirty'

function sortById<T extends { id: string }>(records: T[]): T[] {
  return [...records].sort((left, right) => left.id.localeCompare(right.id))
}

function comparableWorkspace(
  snapshot: Omit<WorkspaceSnapshot, 'id' | 'schemaVersion' | 'createdAt'>
) {
  return {
    activeProjectId: snapshot.activeProjectId,
    projects: sortById(snapshot.projects),
    editorDocuments: sortById(snapshot.editorDocuments),
    viewportSnapshots: sortById(snapshot.viewportSnapshots),
    assets: sortById(snapshot.assets),
    assetBlobs: sortById(snapshot.assetBlobs).map(({ data, ...metadata }) => {
      void data
      return metadata
    }),
    rigCatalog: comparableRigCatalog(snapshot.rigCatalogJson)
  }
}

function comparableRigCatalog(raw?: string): unknown {
  if (!raw) return null
  try {
    const { exportedAt, ...catalog } = parseRigCatalogFile(raw)
    void exportedAt
    return catalog
  } catch {
    return { invalid: raw }
  }
}

function readPersistedRigCatalogJson(): string | undefined {
  return typeof localStorage === 'undefined'
    ? undefined
    : (localStorage.getItem(RIG_CATALOG_STORAGE_KEY) ?? undefined)
}

async function readCurrentWorkspace(activeProjectId: string) {
  const [projects, editorDocuments, viewportSnapshots, assets, assetBlobs] = await Promise.all([
    db.projects.toArray(),
    db.editorDocuments.where('projectId').equals(activeProjectId).toArray(),
    db.viewportSnapshots.toArray(),
    db.assets.toArray(),
    db.assetBlobs.toArray()
  ])
  return {
    activeProjectId,
    projects,
    editorDocuments,
    viewportSnapshots,
    assets,
    assetBlobs,
    rigCatalogJson: readPersistedRigCatalogJson()
  }
}

function summarize(snapshot: WorkspaceSnapshot): WorkspaceSnapshotSummary {
  return {
    createdAt: snapshot.createdAt,
    assetCount: snapshot.assets.length,
    viewportSnapshotCount: snapshot.viewportSnapshots.length,
    totalBlobSize: snapshot.assetBlobs.reduce((total, blob) => total + blob.size, 0)
  }
}

export async function getManualSnapshotSummary(): Promise<WorkspaceSnapshotSummary | null> {
  const snapshot = await db.workspaceSnapshots.get(MANUAL_SNAPSHOT_ID)
  return snapshot ? summarize(snapshot) : null
}

export async function getManualWorkspaceSnapshot(): Promise<WorkspaceSnapshot | null> {
  return (await db.workspaceSnapshots.get(MANUAL_SNAPSHOT_ID)) ?? null
}

export async function compareWorkspaceToManualSnapshot(): Promise<SnapshotComparison> {
  const snapshot = await db.workspaceSnapshots.get(MANUAL_SNAPSHOT_ID)
  if (!snapshot) return 'no_snapshot'
  const current = await readCurrentWorkspace(snapshot.activeProjectId)
  return JSON.stringify(comparableWorkspace(current)) ===
    JSON.stringify(comparableWorkspace(snapshot))
    ? 'saved'
    : 'dirty'
}

export async function createManualWorkspaceSnapshot(
  activeProjectId: string,
  rigCatalogJson: string
): Promise<WorkspaceSnapshotSummary> {
  parseRigCatalogFile(rigCatalogJson)
  const snapshot = await db.transaction(
    'r',
    [db.projects, db.editorDocuments, db.viewportSnapshots, db.assets, db.assetBlobs],
    async (): Promise<WorkspaceSnapshot> => {
      const [project, editorDocuments, viewportSnapshots, assets, assetBlobs] = await Promise.all([
        db.projects.get(activeProjectId),
        db.editorDocuments.where('projectId').equals(activeProjectId).toArray(),
        db.viewportSnapshots.toArray(),
        db.assets.toArray(),
        db.assetBlobs.toArray()
      ])
      return {
        id: MANUAL_SNAPSHOT_ID,
        schemaVersion: 6,
        activeProjectId,
        createdAt: Date.now(),
        projects: project ? [project] : [],
        editorDocuments,
        viewportSnapshots,
        assets,
        assetBlobs,
        rigCatalogJson
      }
    }
  )
  await db.workspaceSnapshots.put(snapshot)
  return summarize(snapshot)
}

export async function restoreManualWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  const snapshot = await db.workspaceSnapshots.get(MANUAL_SNAPSHOT_ID)
  if (!snapshot) throw new Error('Aucune sauvegarde manuelle disponible.')
  return await restoreWorkspaceSnapshot(snapshot)
}

export async function restoreWorkspaceSnapshot(
  snapshot: WorkspaceSnapshot
): Promise<WorkspaceSnapshot> {
  if (snapshot.schemaVersion !== 6) {
    throw new Error(`Version de sauvegarde non prise en charge : ${snapshot.schemaVersion}`)
  }
  if (!snapshot.rigCatalogJson) {
    throw new Error('Le catalogue de rigs est absent de la sauvegarde.')
  }
  if (snapshot.rigCatalogJson) parseRigCatalogFile(snapshot.rigCatalogJson)

  return await db.transaction(
    'rw',
    [
      db.workspaceSnapshots,
      db.projects,
      db.editorDocuments,
      db.viewportSnapshots,
      db.assets,
      db.assetBlobs
    ],
    async () => {
      await Promise.all([
        db.projects.clear(),
        db.editorDocuments.clear(),
        db.viewportSnapshots.clear(),
        db.assets.clear(),
        db.assetBlobs.clear()
      ])
      if (snapshot.projects.length > 0) await db.projects.bulkPut(snapshot.projects)
      if (snapshot.editorDocuments.length > 0)
        await db.editorDocuments.bulkPut(snapshot.editorDocuments)
      if (snapshot.viewportSnapshots.length > 0)
        await db.viewportSnapshots.bulkPut(snapshot.viewportSnapshots)
      if (snapshot.assets.length > 0) await db.assets.bulkPut(snapshot.assets)
      if (snapshot.assetBlobs.length > 0) await db.assetBlobs.bulkPut(snapshot.assetBlobs)
      await db.workspaceSnapshots.put(snapshot)

      if (snapshot.rigCatalogJson && typeof localStorage !== 'undefined') {
        localStorage.setItem(RIG_CATALOG_STORAGE_KEY, snapshot.rigCatalogJson)
      }
      return snapshot
    }
  )
}
