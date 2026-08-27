import type {
  WorkspaceSnapshot,
  WorkspaceSnapshotSummary
} from '@core/types/project.types'
import { db } from '@infrastructure/db/dexie'
import {
  convertLegacySequence,
  convertLegacySavedKeyframe
} from '@infrastructure/db/legacy-migration'

const MANUAL_SNAPSHOT_ID = 'manual' as const

type SnapshotComparison = 'no_snapshot' | 'saved' | 'dirty'

function sortById<T extends { id: string }>(records: T[]): T[] {
  return [...records].sort((left, right) => left.id.localeCompare(right.id))
}

function comparableWorkspace(snapshot: Omit<WorkspaceSnapshot, 'id' | 'schemaVersion' | 'createdAt'>) {
  return {
    activeProjectId: snapshot.activeProjectId,
    projects: sortById(snapshot.projects),
    editorDocuments: sortById(snapshot.editorDocuments ?? []),
    viewportSnapshots: sortById(snapshot.viewportSnapshots ?? []),
    assets: sortById(snapshot.assets),
    assetBlobs: sortById(snapshot.assetBlobs).map(({ data, ...metadata }) => {
      void data
      return metadata
    }),
    characters: sortById(snapshot.characters)
  }
}

async function readCurrentWorkspace(activeProjectId: string) {
  const [projects, editorDocuments, viewportSnapshots, assets, assetBlobs, characters] = await Promise.all([
    db.projects.toArray(),
    db.editorDocuments.where('projectId').equals(activeProjectId).toArray(),
    db.viewportSnapshots.toArray(),
    db.assets.toArray(),
    db.assetBlobs.toArray(),
    db.characters.toArray()
  ])
  return { activeProjectId, projects, editorDocuments, viewportSnapshots, assets, assetBlobs, characters }
}

function summarize(snapshot: WorkspaceSnapshot): WorkspaceSnapshotSummary {
  return {
    createdAt: snapshot.createdAt,
    assetCount: snapshot.assets.length,
    viewportSnapshotCount: snapshot.viewportSnapshots?.length ?? snapshot.savedKeyframes?.length ?? 0,
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
    [db.projects, db.editorDocuments, db.viewportSnapshots, db.assets, db.assetBlobs, db.characters],
    async (): Promise<WorkspaceSnapshot> => {
      const [project, editorDocuments, viewportSnapshots, assets, assetBlobs, characters] =
        await Promise.all([
          db.projects.get(activeProjectId),
          db.editorDocuments.where('projectId').equals(activeProjectId).toArray(),
          db.viewportSnapshots.toArray(),
          db.assets.toArray(),
          db.assetBlobs.toArray(),
          db.characters.toArray()
        ])
      return {
        id: MANUAL_SNAPSHOT_ID,
        schemaVersion: 3,
        activeProjectId,
        createdAt: Date.now(),
        projects: project ? [project] : [],
        editorDocuments,
        viewportSnapshots,
        assets,
        assetBlobs,
        characters
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
      db.editorDocuments,
      db.viewportSnapshots,
      db.assets,
      db.assetBlobs,
      db.characters
    ],
    async () => {
      const snapshot = await db.workspaceSnapshots.get(MANUAL_SNAPSHOT_ID)
      if (!snapshot) throw new Error('Aucune sauvegarde manuelle disponible.')
      if (
        snapshot.schemaVersion !== 1 &&
        snapshot.schemaVersion !== 2 &&
        snapshot.schemaVersion !== 3
      ) {
        throw new Error(`Version de sauvegarde non prise en charge : ${snapshot.schemaVersion}`)
      }

      await Promise.all([
        db.projects.clear(),
        db.editorDocuments.clear(),
        db.viewportSnapshots.clear(),
        db.assets.clear(),
        db.assetBlobs.clear(),
        db.characters.clear()
      ])

      const activeProject = snapshot.projects.find(
        (project) => project.id === snapshot.activeProjectId
      ) ?? snapshot.projects[0]

      // Gestion de la rétro-compatibilité pour snapshots v1 ou v2
      if (snapshot.schemaVersion === 1 || snapshot.schemaVersion === 2) {
        const legacySequences = snapshot.sequences ?? []
        const legacySavedKeyframes = snapshot.savedKeyframes ?? []

        for (const seq of legacySequences) {
          const { document, snapshots } = convertLegacySequence(seq)
          await db.editorDocuments.put(document)
          for (const snap of snapshots) {
            await db.viewportSnapshots.put(snap)
          }

          if (activeProject && seq.projectId === activeProject.id) {
            activeProject.editorDocumentId = document.id
          }
        }

        for (const preset of legacySavedKeyframes) {
          const snap = convertLegacySavedKeyframe(preset)
          await db.viewportSnapshots.put(snap)
        }
      } else {
        // Schéma v3
        if (snapshot.editorDocuments && snapshot.editorDocuments.length > 0) {
          await db.editorDocuments.bulkPut(snapshot.editorDocuments)
        }
        if (snapshot.viewportSnapshots && snapshot.viewportSnapshots.length > 0) {
          await db.viewportSnapshots.bulkPut(snapshot.viewportSnapshots)
        }
      }

      if (activeProject) await db.projects.put(activeProject)
      if (snapshot.assets.length > 0) await db.assets.bulkPut(snapshot.assets)
      if (snapshot.assetBlobs.length > 0) await db.assetBlobs.bulkPut(snapshot.assetBlobs)
      if (snapshot.characters.length > 0) await db.characters.bulkPut(snapshot.characters)

      return snapshot
    }
  )
}
