import type {
  WorkspaceSnapshot,
  WorkspaceSnapshotSummary
} from '@core/types/project.types'
import { db } from '@infrastructure/db/dexie'

const MANUAL_SNAPSHOT_ID = 'manual' as const

function summarize(snapshot: WorkspaceSnapshot): WorkspaceSnapshotSummary {
  return {
    createdAt: snapshot.createdAt,
    assetCount: snapshot.assets.length,
    totalBlobSize: snapshot.assetBlobs.reduce((total, blob) => total + blob.size, 0)
  }
}

export async function getManualSnapshotSummary(): Promise<WorkspaceSnapshotSummary | null> {
  const snapshot = await db.workspaceSnapshots.get(MANUAL_SNAPSHOT_ID)
  return snapshot ? summarize(snapshot) : null
}

export async function createManualWorkspaceSnapshot(
  activeProjectId: string
): Promise<WorkspaceSnapshotSummary> {
  const snapshot = await db.transaction(
    'r',
    [db.projects, db.sequences, db.assets, db.assetBlobs, db.characters],
    async (): Promise<WorkspaceSnapshot> => ({
      id: MANUAL_SNAPSHOT_ID,
      schemaVersion: 1,
      activeProjectId,
      createdAt: Date.now(),
      projects: await db.projects.toArray(),
      sequences: await db.sequences.toArray(),
      assets: await db.assets.toArray(),
      assetBlobs: await db.assetBlobs.toArray(),
      characters: await db.characters.toArray()
    })
  )

  await db.workspaceSnapshots.put(snapshot)
  return summarize(snapshot)
}

export async function restoreManualWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  return await db.transaction(
    'rw',
    [
      db.workspaceSnapshots,
      db.projects,
      db.sequences,
      db.assets,
      db.assetBlobs,
      db.characters
    ],
    async () => {
      const snapshot = await db.workspaceSnapshots.get(MANUAL_SNAPSHOT_ID)
      if (!snapshot) throw new Error('Aucune sauvegarde manuelle disponible.')
      if (snapshot.schemaVersion !== 1) {
        throw new Error(`Version de sauvegarde non prise en charge : ${snapshot.schemaVersion}`)
      }

      await Promise.all([
        db.projects.clear(),
        db.sequences.clear(),
        db.assets.clear(),
        db.assetBlobs.clear(),
        db.characters.clear()
      ])

      if (snapshot.projects.length > 0) await db.projects.bulkPut(snapshot.projects)
      if (snapshot.sequences.length > 0) await db.sequences.bulkPut(snapshot.sequences)
      if (snapshot.assets.length > 0) await db.assets.bulkPut(snapshot.assets)
      if (snapshot.assetBlobs.length > 0) await db.assetBlobs.bulkPut(snapshot.assetBlobs)
      if (snapshot.characters.length > 0) await db.characters.bulkPut(snapshot.characters)

      return snapshot
    }
  )
}
