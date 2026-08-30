import { describe, expect, it } from 'vitest'
import type { WorkspaceSnapshot } from '@core/types/project.types'
import { DEFAULT_SHADER_SETTINGS } from '@core/constants/editor'
import {
  parseWorkspaceBackupFile,
  serializeWorkspaceBackupFile,
  workspaceBackupFilename
} from './workspace-backup-file.service'

const now = 1_725_000_000_000

function snapshotFixture(): WorkspaceSnapshot {
  return {
    id: 'manual',
    schemaVersion: 5,
    activeProjectId: 'project-1',
    createdAt: now,
    projects: [
      {
        id: 'project-1',
        stage: { width: 1920, height: 1080, backgroundColor: '#000000' },
        editorDocumentId: 'document-1',
        createdAt: now,
        updatedAt: now
      }
    ],
    editorDocuments: [
      {
        id: 'document-1',
        projectId: 'project-1',
        name: 'Scène courante',
        camera: { enabled: true, x: 12, y: 24, width: 1280, height: 720, aspectRatio: '16:9' },
        depthOfField: { enabled: true, focusY: 0.6, feather: 0.2, blurRadius: 8 },
        colorGrading: {
          enabled: false,
          preset: 'neutral',
          exposure: 0,
          contrast: 0,
          saturation: 0,
          temperature: 0,
          tint: 0
        },
        shaderSettings: { ...DEFAULT_SHADER_SETTINGS },
        groups: [
          {
            id: 'group-1',
            name: 'Berlu',
            kind: 'character',
            characterKey: 'berlu',
            activeMode: 'rig',
            activeRigId: 'rig-1',
            allowedCategories: ['body', 'head'],
            zIndex: 20,
            transform: { x: 120, y: -30, scaleX: 1.2, scaleY: 1.2, rotation: 4, opacity: 1 },
            muted: false,
            locked: false,
            collapsed: false,
            color: 'indigo',
            isDefault: true
          }
        ],
        layers: [
          {
            id: 'layer-1',
            assetId: 'asset-1',
            name: 'Corps',
            category: 'body',
            groupId: 'group-1',
            zIndex: 20,
            order: 0,
            muted: false,
            locked: false,
            depthRole: 'auto',
            transform: { x: 7, y: 9, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 }
          }
        ],
        createdAt: now,
        updatedAt: now
      }
    ],
    viewportSnapshots: [
      {
        id: 'scene-1',
        name: 'Plan large',
        thumbnailDataUrl: 'data:image/png;base64,iVBORw==',
        camera: { enabled: true, x: 12, y: 24, width: 1280, height: 720, aspectRatio: '16:9' },
        depthOfField: { enabled: false, focusY: 0.5, feather: 0.2, blurRadius: 0 },
        colorGrading: {
          enabled: false,
          preset: 'neutral',
          exposure: 0,
          contrast: 0,
          saturation: 0,
          temperature: 0,
          tint: 0
        },
        shaderSettings: { ...DEFAULT_SHADER_SETTINGS },
        groups: [],
        layers: [],
        createdAt: now,
        updatedAt: now
      }
    ],
    assets: [
      {
        id: 'asset-1',
        name: 'Corps',
        category: 'body',
        tags: ['berlu'],
        blobId: 'blob-1',
        width: 840,
        height: 908,
        character: { key: 'berlu', name: 'Berlu', form: 'rig' },
        isMovable: false,
        createdAt: now,
        updatedAt: now
      }
    ],
    assetBlobs: [
      {
        id: 'blob-1',
        mimeType: 'image/png',
        data: new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }),
        size: 4,
        createdAt: now
      }
    ],
    rigCatalogJson: JSON.stringify({
      schema: 'berlu-creator/rig-catalog',
      version: 6,
      exportedAt: new Date(now).toISOString(),
      defaultRigByCharacter: { berlu: 'rig-1' },
      rigs: [
        {
          id: 'rig-1',
          name: 'Rig Berlu',
          characterKey: 'berlu',
          characterName: 'Berlu',
          canvasWidth: 840,
          canvasHeight: 908,
          body: { name: 'Corps', category: 'body', width: 840, height: 908 },
          bodyCalibration: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
          bodyOrigin: { x: 420, y: 454 },
          categories: [
            {
              category: 'head',
              enabled: true,
              template: { x: 104, y: 42, scaleX: 0.92, scaleY: 0.92, rotation: 3 },
              defaultPartKey: 'head:tête:260x309'
            }
          ],
          parts: [
            {
              asset: { name: 'Tête', category: 'head', width: 260, height: 309 },
              calibrationOverride: {
                x: 111,
                y: 39,
                scaleX: 0.88,
                scaleY: 0.88,
                rotation: -2,
                zIndex: 12
              }
            }
          ],
          excludedPartKeys: [],
          updatedAt: now
        }
      ]
    })
  }
}

describe('workspace-backup-file.service', () => {
  it('préserve les données Dexie, les blobs et le catalogue des rigs en round-trip', async () => {
    const raw = await serializeWorkspaceBackupFile(snapshotFixture())
    const restored = parseWorkspaceBackupFile(raw)

    expect(restored).toMatchObject({
      id: 'manual',
      schemaVersion: 5,
      activeProjectId: 'project-1',
      projects: [{ id: 'project-1', editorDocumentId: 'document-1' }],
      editorDocuments: [
        {
          id: 'document-1',
          groups: [{ activeRigId: 'rig-1', transform: { x: 120, y: -30 } }],
          layers: [{ transform: { x: 7, y: 9 } }]
        }
      ],
      viewportSnapshots: [{ id: 'scene-1', name: 'Plan large' }],
      assets: [{ id: 'asset-1', blobId: 'blob-1' }],
      assetBlobs: [{ id: 'blob-1', mimeType: 'image/png', size: 4 }]
    })
    const catalog = JSON.parse(restored.rigCatalogJson ?? '{}')
    expect(catalog).toMatchObject({
      schema: 'berlu-creator/rig-catalog',
      version: 6,
      rigs: [{ id: 'rig-1', bodyCalibration: { x: 0, y: 0 } }]
    })
    expect(catalog.rigs[0].categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'head',
          template: expect.objectContaining({ x: 104, y: 42 })
        })
      ])
    )
    expect(catalog.rigs[0].parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          calibrationOverride: expect.objectContaining({ x: 111, y: 39, zIndex: 12 })
        })
      ])
    )

    const secondExport = JSON.parse(await serializeWorkspaceBackupFile(restored))
    expect(secondExport.workspace.assetBlobs[0].dataBase64).toBe('iVBORw==')
  })

  it('refuse un JSON quelconque avant toute restauration', () => {
    expect(() => parseWorkspaceBackupFile('{"hello":"world"}')).toThrow(
      'Ce fichier n’est pas une sauvegarde complète de Berlu Studio.'
    )
  })

  it('génère un nom de fichier stable et portable', () => {
    expect(workspaceBackupFilename(new Date('2026-08-29T12:34:56.789Z'))).toBe(
      'berlu-studio-backup-2026-08-29T12-34-56Z.json'
    )
  })
})
