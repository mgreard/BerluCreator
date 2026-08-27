import type { AssetCategory } from '@core/types/asset.types'
import type {
  CameraFrame,
  EditorDocument,
  EditorGroup,
  EditorGroupColor,
  EditorLayer,
  Transform2D,
  ViewportSnapshot
} from '@core/types/editor.types'
import { DEFAULT_STAGE_RESOLUTION, DEFAULT_EDITOR_GROUPS } from '@core/constants/editor'

export interface LegacyKeyframeSprite {
  id: string
  assetId: string
  transform?: Partial<Transform2D>
  label?: string
  order: number
}

export interface LegacyKeyframe {
  id: string
  stepId: string
  sprites: LegacyKeyframeSprite[]
  zIndex: number
  muted: boolean
  locked: boolean
}

export interface LegacyStepGroupState {
  groupId: string
  zIndex: number
  transform?: Partial<Transform2D>
  muted: boolean
  locked: boolean
}

export interface LegacySequenceStep {
  id: string
  label: string
  order: number
  groupStates: LegacyStepGroupState[]
  camera: CameraFrame
}

export interface LegacyTrackGroup {
  id: string
  name: string
  zIndex: number
  transform?: Partial<Transform2D>
  muted?: boolean
  locked?: boolean
  collapsed?: boolean
  color?: EditorGroupColor
  allowedCategories: AssetCategory[]
  isDefault?: boolean
  customCategory?: string
}

export interface LegacyTimelineTrack {
  id: string
  name: string
  category: AssetCategory
  targetSlot?: AssetCategory
  groupId: string
  zIndex: number
  muted: boolean
  locked: boolean
  keyframes: LegacyKeyframe[]
}

export interface LegacySequence {
  id: string
  projectId: string
  name: string
  steps: LegacySequenceStep[]
  groups?: LegacyTrackGroup[]
  tracks: LegacyTimelineTrack[]
  createdAt: number
  updatedAt: number
}

export interface LegacySavedKeyframeSprite {
  assetId: string
  transform?: Partial<Transform2D>
  label?: string
  order: number
}

export interface LegacySavedKeyframeTrack {
  sourceTrackId: string
  name: string
  category: AssetCategory
  targetSlot?: AssetCategory
  sourceGroupId?: string
  zIndex: number
  sprites: LegacySavedKeyframeSprite[]
}

export interface LegacySavedKeyframeGroup {
  sourceGroupId: string
  name: string
  zIndex: number
  transform?: Partial<Transform2D>
}

export interface LegacySavedKeyframePreset {
  id: string
  name: string
  sourceStepLabel?: string
  thumbnailDataUrl: string
  tracks: LegacySavedKeyframeTrack[]
  groups: LegacySavedKeyframeGroup[]
  createdAt: number
  updatedAt: number
}

export function convertStepToLayers(
  tracks: LegacyTimelineTrack[],
  stepId: string
): EditorLayer[] {
  const layers: EditorLayer[] = []

  for (const track of tracks) {
    if (track.muted) continue
    const activeKeyframe =
      track.keyframes.find((kf) => kf.stepId === stepId) ?? track.keyframes[0]
    if (!activeKeyframe || activeKeyframe.muted) continue

    const sortedSprites = [...activeKeyframe.sprites].sort(
      (a, b) => a.order - b.order
    )
    for (const [index, sprite] of sortedSprites.entries()) {
      layers.push({
        id: `layer_${track.id}_${sprite.id || index}`,
        assetId: sprite.assetId,
        name: sprite.label || track.name,
        category: track.category as AssetCategory,
        groupId: track.groupId,
        zIndex: activeKeyframe.zIndex ?? track.zIndex,
        order: sprite.order ?? index,
        transform: sprite.transform ? { ...sprite.transform } : undefined,
        muted: false,
        locked: activeKeyframe.locked || track.locked || false
      })
    }
  }

  return layers
}

export function convertStepToGroups(
  sequenceGroups: LegacySequence['groups'],
  step?: LegacySequenceStep
): EditorGroup[] {
  const baseGroups = sequenceGroups && sequenceGroups.length > 0
    ? sequenceGroups
    : DEFAULT_EDITOR_GROUPS

  return baseGroups.map((group) => {
    const stepState = step?.groupStates?.find((s) => s.groupId === group.id)
    return {
      id: group.id,
      name: group.name,
      zIndex: stepState?.zIndex ?? group.zIndex,
      transform: stepState?.transform
        ? { ...stepState.transform }
        : group.transform
          ? { ...group.transform }
          : undefined,
      muted: stepState?.muted ?? group.muted ?? false,
      locked: stepState?.locked ?? group.locked ?? false,
      collapsed: group.collapsed ?? false,
      color: group.color,
      allowedCategories: [...group.allowedCategories],
      isDefault: group.isDefault,
      customCategory: group.customCategory
    }
  })
}

export function createDefaultCamera(): CameraFrame {
  return {
    enabled: false,
    x: 0,
    y: 0,
    width: DEFAULT_STAGE_RESOLUTION.width,
    height: DEFAULT_STAGE_RESOLUTION.height,
    aspectRatio: '16:9'
  }
}

/**
 * Convertit une séquence legacy en :
 * 1. Un EditorDocument (fondé sur la 1ère étape)
 * 2. Une liste de ViewportSnapshot (toutes les étapes)
 */
export function convertLegacySequence(sequence: LegacySequence): {
  document: EditorDocument
  snapshots: ViewportSnapshot[]
} {
  const orderedSteps = [...(sequence.steps || [])].sort((a, b) => a.order - b.order)
  const firstStep = orderedSteps[0]
  const firstStepId = firstStep?.id || 'step_default'

  const firstStepCamera = firstStep?.camera || createDefaultCamera()
  const firstStepGroups = convertStepToGroups(sequence.groups, firstStep)
  const firstStepLayers = convertStepToLayers(sequence.tracks || [], firstStepId)

  const berluGroup = firstStepGroups.find((g) => g.id === 'grp_berlu')
  const character = {
    x: berluGroup?.transform?.x ?? 0,
    y: berluGroup?.transform?.y ?? 0,
    scaleX: berluGroup?.transform?.scaleX ?? 1,
    scaleY: berluGroup?.transform?.scaleY ?? 1,
    rotation: berluGroup?.transform?.rotation ?? 0,
    visible: !(berluGroup?.muted ?? false),
    zIndex: berluGroup?.zIndex ?? 10
  }

  const document: EditorDocument = {
    id: sequence.id || 'doc_default',
    projectId: sequence.projectId || 'proj_default',
    name: sequence.name || 'Document Principal',
    camera: firstStepCamera,
    character,
    groups: firstStepGroups,
    layers: firstStepLayers,
    createdAt: sequence.createdAt || Date.now(),
    updatedAt: sequence.updatedAt || Date.now()
  }

  const snapshots: ViewportSnapshot[] = []
  for (const step of orderedSteps) {
    const stepCamera = step.camera || createDefaultCamera()
    const stepGroups = convertStepToGroups(sequence.groups, step)
    const stepLayers = convertStepToLayers(sequence.tracks || [], step.id)
    const stepBerlu = stepGroups.find((g) => g.id === 'grp_berlu')

    snapshots.push({
      id: `snap_${sequence.id}_${step.id}`,
      name: `${sequence.name || 'Séquence'} — ${step.label || 'Étape'}`,
      thumbnailDataUrl: '',
      camera: stepCamera,
      character: {
        x: stepBerlu?.transform?.x ?? 0,
        y: stepBerlu?.transform?.y ?? 0,
        scaleX: stepBerlu?.transform?.scaleX ?? 1,
        scaleY: stepBerlu?.transform?.scaleY ?? 1,
        rotation: stepBerlu?.transform?.rotation ?? 0,
        visible: !(stepBerlu?.muted ?? false),
        zIndex: stepBerlu?.zIndex ?? 10
      },
      groups: stepGroups,
      layers: stepLayers,
      createdAt: sequence.createdAt || Date.now(),
      updatedAt: sequence.updatedAt || Date.now()
    })
  }

  return { document, snapshots }
}

/**
 * Convertit un SavedKeyframePreset legacy en ViewportSnapshot autonome
 */
export function convertLegacySavedKeyframe(
  preset: LegacySavedKeyframePreset
): ViewportSnapshot {
  const groups: EditorGroup[] = (preset.groups || []).map((g) => ({
    id: g.sourceGroupId,
    name: g.name,
    zIndex: g.zIndex,
    transform: g.transform ? { ...g.transform } : undefined,
    allowedCategories: []
  }))

  const layers: EditorLayer[] = []
  for (const track of preset.tracks || []) {
    for (const [index, sprite] of (track.sprites || []).entries()) {
      layers.push({
        id: `layer_${track.sourceTrackId}_${sprite.assetId}_${index}`,
        assetId: sprite.assetId,
        name: sprite.label || track.name,
        category: track.category as AssetCategory,
        groupId: track.sourceGroupId || 'grp_set_props',
        zIndex: track.zIndex,
        order: sprite.order ?? index,
        transform: sprite.transform ? { ...sprite.transform } : undefined,
        muted: false,
        locked: false
      })
    }
  }

  const berlu = groups.find((g) => g.id === 'grp_berlu')

  return {
    id: `snap_${preset.id}`,
    name: preset.name || 'Pose Sauvegardée',
    thumbnailDataUrl: preset.thumbnailDataUrl || '',
    camera: createDefaultCamera(),
    character: {
      x: berlu?.transform?.x ?? 0,
      y: berlu?.transform?.y ?? 0,
      scaleX: berlu?.transform?.scaleX ?? 1,
      scaleY: berlu?.transform?.scaleY ?? 1,
      rotation: berlu?.transform?.rotation ?? 0,
      visible: !(berlu?.muted ?? false),
      zIndex: berlu?.zIndex ?? 10
    },
    groups: groups.length > 0 ? groups : DEFAULT_EDITOR_GROUPS,
    layers,
    createdAt: preset.createdAt || Date.now(),
    updatedAt: preset.updatedAt || Date.now()
  }
}
