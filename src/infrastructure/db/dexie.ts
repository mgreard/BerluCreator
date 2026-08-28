import Dexie, { type EntityTable } from 'dexie'
import type { Asset, AssetBlobRecord, AssetCategory } from '@core/types/asset.types'
import type { Project, WorkspaceSnapshot } from '@core/types/project.types'
import type {
  CharacterGroup,
  EditorDocument,
  EditorGroup,
  EditorLayer,
  Transform2D,
  ViewportSnapshot
} from '@core/types/editor.types'
import {
  CHARACTER_CATEGORIES,
  DEFAULT_EDITOR_GROUPS,
  DEFAULT_TRANSFORM
} from '@core/constants/editor'

export interface V4CharacterState {
  x?: number
  y?: number
  scaleX?: number
  scaleY?: number
  rotation?: number
  visible?: boolean
  zIndex?: number
}

export interface V4Group {
  id: string
  name: string
  zIndex?: number
  transform?: Partial<Transform2D>
  muted?: boolean
  locked?: boolean
  collapsed?: boolean
  color?: EditorGroup['color']
  allowedCategories?: string[]
  isDefault?: boolean
  customCategory?: string
}

export interface V4Layer {
  id: string
  assetId: string
  name: string
  category: string
  groupId?: string
  zIndex?: number
  order?: number
  muted?: boolean
  locked?: boolean
  transform?: Partial<Transform2D>
  localX?: number
  localY?: number
  scaleX?: number
  scaleY?: number
  rotation?: number
}

export interface V4Document {
  id: string
  projectId: string
  name: string
  camera: EditorDocument['camera']
  character?: V4CharacterState
  groups?: V4Group[]
  layers: V4Layer[]
  createdAt: number
  updatedAt: number
}

interface V4Snapshot {
  id: string
  name: string
  thumbnailDataUrl: string
  camera: ViewportSnapshot['camera']
  character?: V4CharacterState
  groups?: V4Group[]
  layers: V4Layer[]
  createdAt: number
  updatedAt: number
}

export type V4Asset = Omit<Asset, 'category' | 'character'> & {
  category: string
  character?: Asset['character']
  displayWidth?: number
  displayHeight?: number
}

const SYSTEM_TAGS = new Set([
  'arms', 'arms_left', 'arms_right', 'bras', 'left', 'right', 'head', 'face',
  'mouth', 'bouche', 'phoneme', 'torso', 'body', 'corps', 'eyes', 'props_host',
  'props-set', 'props_set', 'props-desk', 'props_desk', 'background', 'desk',
  'foreground', 'full', 'complet', 'sprite', 'accessoire', 'objet', 'plateau'
])

function transformOf(transform?: Partial<Transform2D>): Transform2D {
  const scale = transform?.scaleX ?? transform?.scaleY ?? DEFAULT_TRANSFORM.scaleX
  return { ...DEFAULT_TRANSFORM, ...(transform ?? {}), scaleX: scale, scaleY: scale }
}

function slugify(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'berlu'
}

function inferCharacterName(asset: V4Asset): string {
  const explicit = asset.character?.name?.trim()
  if (explicit) return explicit
  return asset.tags.find((tag) => {
    const clean = tag.toLowerCase().trim()
    return clean && !SYSTEM_TAGS.has(clean) && !clean.includes('_')
  }) ?? 'Berlu'
}

function isFullAsset(asset: V4Asset): boolean {
  const searchable = `${asset.name} ${asset.tags.join(' ')}`.toLowerCase()
  return asset.category === 'character_full' ||
    (asset.category === 'torso' && (searchable.includes('full') || searchable.includes('complet')))
}

function migrateCategory(category: string, full = false): AssetCategory {
  if (full) return 'character_full'
  if (category === 'torso') return 'body'
  const allowed: readonly string[] = [
    'background', 'character_full', 'body', 'head', 'mouth', 'eyes', 'props_host',
    'arms_left', 'arms_right', 'props_set', 'desk', 'props_desk', 'foreground'
  ]
  return allowed.includes(category) ? category as AssetCategory : 'props_set'
}

export function migrateV4Asset(raw: V4Asset): Asset {
  const full = isFullAsset(raw)
  const category = migrateCategory(raw.category, full)
  const characterAnchored = CHARACTER_CATEGORIES.includes(category as typeof CHARACTER_CATEGORIES[number])
  const characterName = characterAnchored ? inferCharacterName(raw) : undefined
  return {
    id: raw.id,
    name: raw.name,
    category,
    tags: [...raw.tags],
    blobId: raw.blobId,
    width: raw.width,
    height: raw.height,
    character: characterName
      ? { key: raw.character?.key || slugify(characterName), name: characterName, form: full ? 'full' : 'rig' }
      : undefined,
    calibration: raw.calibration,
    isMovable: raw.isMovable ?? !characterAnchored,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt
  }
}

function migrateGroups(
  rawGroups: V4Group[] | undefined,
  rawLayers: V4Layer[],
  character: V4CharacterState | undefined,
  assets: Map<string, Asset>
): EditorGroup[] {
  const source = rawGroups?.length ? rawGroups : DEFAULT_EDITOR_GROUPS
  return source.map((raw) => {
    if ('kind' in raw && (raw.kind === 'stage' || raw.kind === 'character')) {
      const normalized = raw as EditorGroup
      if (normalized.kind !== 'character' || normalized.id !== 'grp_berlu' || !character) {
        return normalized
      }
      return {
        ...normalized,
        zIndex: character.zIndex ?? normalized.zIndex,
        muted: character.visible === false || normalized.muted,
        transform: transformOf({
          ...normalized.transform,
          x: character.x,
          y: character.y,
          scaleX: character.scaleX,
          scaleY: character.scaleY,
          rotation: character.rotation
        })
      }
    }
    const characterLayers = rawLayers.filter((layer) =>
      layer.groupId === raw.id && assets.get(layer.assetId)?.character
    )
    const isCharacter = raw.id === 'grp_berlu' || Boolean(raw.customCategory) || characterLayers.length > 0
    const base = {
      id: raw.id,
      name: raw.name,
      zIndex: raw.id === 'grp_berlu' ? character?.zIndex ?? raw.zIndex ?? 20 : raw.zIndex ?? 0,
      transform: transformOf(raw.id === 'grp_berlu' && character
        ? {
            ...raw.transform,
            x: character.x,
            y: character.y,
            scaleX: character.scaleX,
            scaleY: character.scaleY,
            rotation: character.rotation
          }
        : raw.transform),
      muted: raw.id === 'grp_berlu' ? character?.visible === false || Boolean(raw.muted) : Boolean(raw.muted),
      locked: Boolean(raw.locked),
      collapsed: Boolean(raw.collapsed),
      color: raw.color ?? 'indigo',
      isDefault: Boolean(raw.isDefault)
    }
    if (isCharacter) {
      const firstAsset = assets.get(characterLayers[0]?.assetId)
      const name = firstAsset?.character?.name || raw.customCategory || raw.name || 'Berlu'
      const hasVisibleFull = characterLayers.some((layer) =>
        assets.get(layer.assetId)?.category === 'character_full' && !layer.muted
      )
      return {
        ...base,
        kind: 'character',
        characterKey: firstAsset?.character?.key || slugify(name),
        activeMode: hasVisibleFull ? 'full' : 'rig',
        allowedCategories: [...CHARACTER_CATEGORIES]
      } satisfies CharacterGroup
    }
    return {
      ...base,
      kind: 'stage',
      allowedCategories: (raw.allowedCategories ?? []).map((category) => migrateCategory(category))
    }
  })
}

function fallbackGroupId(category: AssetCategory, groups: EditorGroup[]): string {
  if (CHARACTER_CATEGORIES.includes(category as typeof CHARACTER_CATEGORIES[number])) {
    return groups.find((group) => group.kind === 'character')?.id ?? 'grp_berlu'
  }
  return groups.find((group) => group.kind === 'stage' && group.allowedCategories.includes(category))?.id
    ?? groups.find((group) => group.kind === 'stage')?.id
    ?? groups[0].id
}

function migrateLayers(rawLayers: V4Layer[], groups: EditorGroup[], assets: Map<string, Asset>): EditorLayer[] {
  return rawLayers.map((raw, index) => {
    const category = assets.get(raw.assetId)?.category ?? migrateCategory(raw.category)
    return {
      id: raw.id,
      assetId: raw.assetId,
      name: raw.name,
      category,
      groupId: groups.some((group) => group.id === raw.groupId)
        ? raw.groupId as string
        : fallbackGroupId(category, groups),
      zIndex: raw.zIndex ?? 0,
      order: raw.order ?? index,
      muted: Boolean(raw.muted),
      locked: Boolean(raw.locked),
      transform: transformOf({
        x: raw.transform?.x ?? raw.localX,
        y: raw.transform?.y ?? raw.localY,
        scaleX: raw.transform?.scaleX ?? raw.scaleX,
        scaleY: raw.transform?.scaleY ?? raw.scaleY,
        rotation: raw.transform?.rotation ?? raw.rotation,
        opacity: raw.transform?.opacity
      })
    }
  })
}

export function migrateV4Document(raw: V4Document, assets: Map<string, Asset>): EditorDocument {
  const groups = migrateGroups(raw.groups, raw.layers, raw.character, assets)
  return {
    id: raw.id,
    projectId: raw.projectId,
    name: raw.name,
    camera: raw.camera,
    groups,
    layers: migrateLayers(raw.layers, groups, assets),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt
  }
}

function migrateV4Snapshot(raw: V4Snapshot, assets: Map<string, Asset>): ViewportSnapshot {
  const groups = migrateGroups(raw.groups, raw.layers, raw.character, assets)
  return {
    id: raw.id,
    name: raw.name,
    thumbnailDataUrl: raw.thumbnailDataUrl,
    camera: raw.camera,
    groups,
    layers: migrateLayers(raw.layers, groups, assets),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt
  }
}

export class BerluDatabase extends Dexie {
  assets!: EntityTable<Asset, 'id'>
  assetBlobs!: EntityTable<AssetBlobRecord, 'id'>
  projects!: EntityTable<Project, 'id'>
  editorDocuments!: EntityTable<EditorDocument, 'id'>
  viewportSnapshots!: EntityTable<ViewportSnapshot, 'id'>
  workspaceSnapshots!: EntityTable<WorkspaceSnapshot, 'id'>

  constructor() {
    super('BerluCreatorDB')

    this.version(4).stores({
      assets: 'id, name, category, *tags, blobId, createdAt, updatedAt',
      assetBlobs: 'id, mimeType, createdAt',
      projects: 'id, createdAt, updatedAt',
      editorDocuments: 'id, projectId, createdAt, updatedAt',
      viewportSnapshots: 'id, name, createdAt, updatedAt',
      workspaceSnapshots: 'id, createdAt',
      characters: 'id, name, createdAt, updatedAt'
    })

    this.version(5)
      .stores({
        assets: 'id, name, category, character.key, blobId, createdAt, updatedAt',
        assetBlobs: 'id, mimeType, createdAt',
        projects: 'id, createdAt, updatedAt',
        editorDocuments: 'id, projectId, createdAt, updatedAt',
        viewportSnapshots: 'id, name, createdAt, updatedAt',
        workspaceSnapshots: 'id, createdAt',
        characters: null
      })
      .upgrade(async (transaction) => {
        const migratedAssets = (await transaction.table('assets').toArray() as V4Asset[]).map(migrateV4Asset)
        const assetMap = new Map(migratedAssets.map((asset) => [asset.id, asset]))
        await transaction.table('assets').bulkPut(migratedAssets)

        const documents = await transaction.table('editorDocuments').toArray() as V4Document[]
        if (documents.length > 0) {
          await transaction.table('editorDocuments').bulkPut(
            documents.map((document) => migrateV4Document(document, assetMap))
          )
        }

        const snapshots = await transaction.table('viewportSnapshots').toArray() as V4Snapshot[]
        if (snapshots.length > 0) {
          await transaction.table('viewportSnapshots').bulkPut(
            snapshots.map((snapshot) => migrateV4Snapshot(snapshot, assetMap))
          )
        }

        const workspace = await transaction.table('workspaceSnapshots').get('manual') as
          | (Omit<WorkspaceSnapshot, 'schemaVersion' | 'assets' | 'editorDocuments' | 'viewportSnapshots'> & {
              schemaVersion: number
              assets?: V4Asset[]
              editorDocuments?: V4Document[]
              viewportSnapshots?: V4Snapshot[]
            })
          | undefined
        if (workspace?.schemaVersion === 3) {
          const workspaceAssets = (workspace.assets ?? []).map(migrateV4Asset)
          const workspaceAssetMap = new Map(workspaceAssets.map((asset) => [asset.id, asset]))
          await transaction.table('workspaceSnapshots').put({
            id: 'manual',
            schemaVersion: 4,
            activeProjectId: workspace.activeProjectId,
            createdAt: workspace.createdAt,
            projects: workspace.projects,
            assets: workspaceAssets,
            assetBlobs: workspace.assetBlobs,
            editorDocuments: (workspace.editorDocuments ?? []).map((document) => migrateV4Document(document, workspaceAssetMap)),
            viewportSnapshots: (workspace.viewportSnapshots ?? []).map((snapshot) => migrateV4Snapshot(snapshot, workspaceAssetMap))
          } satisfies WorkspaceSnapshot)
        } else if (workspace) {
          await transaction.table('workspaceSnapshots').delete('manual')
        }

        const projects = await transaction.table('projects').toArray() as Project[]
        await transaction.table('projects').bulkPut(projects.map((project) => ({
          id: project.id,
          stage: project.stage,
          editorDocumentId: project.editorDocumentId || 'doc_default',
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        } satisfies Project)))
      })
  }
}

export const db = new BerluDatabase()
