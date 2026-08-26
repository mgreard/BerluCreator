import type {
  WorkspaceSnapshot,
  WorkspaceSnapshotSummary
} from '@core/types/project.types'
import { db } from '@infrastructure/db/dexie'

const MANUAL_SNAPSHOT_ID = 'manual' as const

type SnapshotComparison = 'no_snapshot' | 'saved' | 'dirty'

function sortById<T extends { id: string }>(records: T[]): T[] {
  return [...records].sort((left, right) => left.id.localeCompare(right.id))
}

function comparableWorkspace(snapshot: Omit<WorkspaceSnapshot, 'id' | 'schemaVersion' | 'createdAt'>) {
  return {
    activeProjectId: snapshot.activeProjectId,
    projects: sortById(snapshot.projects),
    sequences: sortById(snapshot.sequences),
    assets: sortById(snapshot.assets),
    assetBlobs: sortById(snapshot.assetBlobs).map(({ data, ...metadata }) => {
      void data
      return metadata
    }),
    characters: sortById(snapshot.characters),
    savedKeyframes: sortById(snapshot.savedKeyframes ?? [])
  }
}

async function readCurrentWorkspace(activeProjectId: string) {
  const [projects, sequences, assets, assetBlobs, characters, savedKeyframes] = await Promise.all([
    db.projects.toArray(),
    db.sequences.where('projectId').equals(activeProjectId).toArray(),
    db.assets.toArray(),
    db.assetBlobs.toArray(),
    db.characters.toArray(),
    db.savedKeyframes.toArray()
  ])
  return { activeProjectId, projects, sequences, assets, assetBlobs, characters, savedKeyframes }
}

function summarize(snapshot: WorkspaceSnapshot): WorkspaceSnapshotSummary {
  return {
    createdAt: snapshot.createdAt,
    assetCount: snapshot.assets.length,
    savedKeyframeCount: snapshot.savedKeyframes?.length ?? 0,
    totalBlobSize: snapshot.assetBlobs.reduce((total, blob) => total + blob.size, 0)
  }
}

export async function getManualSnapshotSummary(): Promise<WorkspaceSnapshotSummary | null> {
  const snapshot = await db.workspaceSnapshots.get(MANUAL_SNAPSHOT_ID)
  return snapshot ? summarize(snapshot) : null
}

export async function compareWorkspaceToManualSnapshot(): Promise<SnapshotComparison> {
  const snapshot = await db.workspaceSnapshots.get(MANUAL_SNAPSHOT_ID)
  if (!snapshot) return 'no_snapshot'
  const current = await readCurrentWorkspace(snapshot.activeProjectId)
  return JSON.stringify(comparableWorkspace(current)) === JSON.stringify(comparableWorkspace(snapshot))
    ? 'saved'
    : 'dirty'
}

export async function createManualWorkspaceSnapshot(
  activeProjectId: string
): Promise<WorkspaceSnapshotSummary> {
  const snapshot = await db.transaction(
    'r',
    [db.projects, db.sequences, db.assets, db.assetBlobs, db.characters, db.savedKeyframes],
    async (): Promise<WorkspaceSnapshot> => {
      const [project, sequences, assets, assetBlobs, characters, savedKeyframes] =
        await Promise.all([
          db.projects.get(activeProjectId),
          db.sequences.where('projectId').equals(activeProjectId).toArray(),
          db.assets.toArray(),
          db.assetBlobs.toArray(),
          db.characters.toArray(),
          db.savedKeyframes.toArray()
        ])
      return {
        id: MANUAL_SNAPSHOT_ID,
        schemaVersion: 2,
        activeProjectId,
        createdAt: Date.now(),
        projects: project ? [project] : [],
        sequences,
        assets,
        assetBlobs,
        characters,
        savedKeyframes
      }
    }
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
      db.characters,
      db.savedKeyframes
    ],
    async () => {
      const snapshot = await db.workspaceSnapshots.get(MANUAL_SNAPSHOT_ID)
      if (!snapshot) throw new Error('Aucune sauvegarde manuelle disponible.')
      if (snapshot.schemaVersion !== 1 && snapshot.schemaVersion !== 2) {
        throw new Error(`Version de sauvegarde non prise en charge : ${snapshot.schemaVersion}`)
      }

      await Promise.all([
        db.projects.clear(),
        db.sequences.clear(),
        db.assets.clear(),
        db.assetBlobs.clear(),
        db.characters.clear(),
        db.savedKeyframes.clear()
      ])

      const activeProject = snapshot.projects.find(
        (project) => project.id === snapshot.activeProjectId
      ) ?? snapshot.projects[0]
      const activeSequences = snapshot.sequences.filter(
        (sequence) => !activeProject || sequence.projectId === activeProject.id
      )
      if (activeProject) await db.projects.put(activeProject)
      if (activeSequences.length > 0) await db.sequences.bulkPut(activeSequences)
      if (snapshot.assets.length > 0) await db.assets.bulkPut(snapshot.assets)
      if (snapshot.assetBlobs.length > 0) await db.assetBlobs.bulkPut(snapshot.assetBlobs)
      if (snapshot.characters.length > 0) await db.characters.bulkPut(snapshot.characters)
      if (snapshot.savedKeyframes?.length) {
        await db.savedKeyframes.bulkPut(snapshot.savedKeyframes)
      }

      return snapshot
    }
  )
}
