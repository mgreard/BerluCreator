import { describe, expect, it } from 'vitest'
import type { WorkspaceSnapshot } from '@core/types/project.types'
import { DEFAULT_COLOR_GRADING_SETTINGS, DEFAULT_DEPTH_OF_FIELD_SETTINGS, DEFAULT_SHADER_SETTINGS } from '@core/constants/editor'
import { createBerluHeadSeries, createRigCatalogFile } from '@/features/studio/rig-calibration/rig-catalog.service'
import {
  parseWorkspaceBackupFile,
  serializeWorkspaceBackupFile,
  workspaceBackupFilename
} from './workspace-backup-file.service'

const now = 1_725_000_000_000

function snapshotFixture(): WorkspaceSnapshot {
  const rigCatalog = createRigCatalogFile(
    [{
      id: 'rig-1', name: 'Rig Berlu', characterKey: 'berlu', characterName: 'Berlu',
      body: { name: 'Corps', category: 'body', width: 840, height: 908 },
      neckAnchor: { x: 420, y: 120 }, headMotionRadius: 60,
      headSeries: [{ seriesId: 'berlu', enabled: true, defaultScale: 0.4, defaultRotation: 3 }],
      calibrated: true, updatedAt: now
    }],
    { berlu: 'rig-1' },
    [createBerluHeadSeries()]
  )
  return {
    id: 'manual', schemaVersion: 6, activeProjectId: 'project-1', createdAt: now,
    projects: [{
      id: 'project-1', stage: { width: 1920, height: 1080, backgroundColor: '#000' },
      editorDocumentId: 'document-1', createdAt: now, updatedAt: now
    }],
    editorDocuments: [{
      id: 'document-1', projectId: 'project-1', name: 'Scène',
      camera: { enabled: false, x: 0, y: 0, width: 1920, height: 1080, aspectRatio: '16:9' },
      depthOfField: { ...DEFAULT_DEPTH_OF_FIELD_SETTINGS },
      colorGrading: { ...DEFAULT_COLOR_GRADING_SETTINGS },
      shaderSettings: { ...DEFAULT_SHADER_SETTINGS },
      groups: [], layers: [], createdAt: now, updatedAt: now
    }],
    viewportSnapshots: [],
    assets: [{
      id: 'asset-1', name: 'Corps', category: 'body', tags: ['berlu'], blobId: 'blob-1',
      width: 840, height: 908, source: 'uploaded',
      character: { key: 'berlu', name: 'Berlu', form: 'rig' },
      isMovable: false, createdAt: now, updatedAt: now
    }],
    assetBlobs: [{
      id: 'blob-1', mimeType: 'image/png',
      data: new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }),
      size: 4, createdAt: now
    }],
    rigCatalogJson: JSON.stringify(rigCatalog)
  }
}

describe('workspace backup file v2', () => {
  it('round-trips schema 6, blobs and rig catalog v7', async () => {
    const restored = parseWorkspaceBackupFile(await serializeWorkspaceBackupFile(snapshotFixture()))
    expect(restored).toMatchObject({ schemaVersion: 6, activeProjectId: 'project-1' })
    expect(restored.assetBlobs[0]).toMatchObject({ id: 'blob-1', size: 4 })
    expect(JSON.parse(restored.rigCatalogJson ?? '{}')).toMatchObject({
      version: 7,
      rigs: [{ id: 'rig-1', neckAnchor: { x: 420, y: 120 } }]
    })
  })

  it('rejects previous backup versions explicitly', async () => {
    const legacy = JSON.parse(await serializeWorkspaceBackupFile(snapshotFixture()))
    legacy.version = 1
    expect(() => parseWorkspaceBackupFile(JSON.stringify(legacy))).toThrow(
      'Version de fichier non prise en charge : 1'
    )
  })

  it('rejects unrelated JSON', () => {
    expect(() => parseWorkspaceBackupFile('{"hello":"world"}')).toThrow(/sauvegarde complète/)
  })

  it('creates a stable portable filename', () => {
    expect(workspaceBackupFilename(new Date('2026-08-29T12:34:56.789Z'))).toBe(
      'berlu-studio-backup-2026-08-29T12-34-56Z.json'
    )
  })
})
