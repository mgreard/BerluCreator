import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  CameraFrame,
  CharacterGroup,
  CharacterMode,
  ColorGradingSettings,
  DepthOfFieldSettings,
  EditorDocument,
  EditorGroup,
  EditorLayer,
  LayerDepthRole,
  ShaderSettings,
  Transform2D,
  ViewportSnapshot
} from '@core/types/editor.types'
import type { Asset, AssetCalibration, AssetCategory } from '@core/types/asset.types'
import {
  CHARACTER_CATEGORIES,
  DEFAULT_COLOR_GRADING_SETTINGS,
  DEFAULT_DEPTH_OF_FIELD_SETTINGS,
  DEFAULT_EDITOR_GROUPS,
  DEFAULT_SHADER_SETTINGS,
  DEFAULT_STAGE_RESOLUTION,
  DEFAULT_TRANSFORM,
  FREE_ACCESSORY_CATEGORIES
} from '@core/constants/editor'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { editorDocumentRepository } from '@infrastructure/db/repositories/editor-document.repository'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { generateId } from '@/lib/utils'
import { useRigCatalogStore } from '@/features/studio/rig-calibration/rig-catalog.store'
import { DEFAULT_RIG_CANVAS } from '@/features/studio/rig-calibration/rig-catalog.service'

interface StudioState {
  depthOfField: DepthOfFieldSettings
  colorGrading: ColorGradingSettings
  shaderSettings: ShaderSettings
  groups: EditorGroup[]
  layers: EditorLayer[]
  rigCatalogSnapshot?: string
}

interface StudioHistoryEntry {
  label: string
  before: StudioState
  after: StudioState
}

interface StudioGesture {
  label: string
  before: StudioState
}

export interface CharacterRigLayerPreset {
  assetId: string
  category: AssetCategory
  name: string
  calibration: AssetCalibration
}

const MAX_HISTORY = 50

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function normalizeTransform(transform?: Partial<Transform2D>): Transform2D {
  return {
    ...DEFAULT_TRANSFORM,
    ...(transform ?? {}),
    scaleX: transform?.scaleX !== undefined ? transform.scaleX : DEFAULT_TRANSFORM.scaleX,
    scaleY: transform?.scaleY !== undefined ? transform.scaleY : DEFAULT_TRANSFORM.scaleY
  }
}

function normalizeDepthOfField(settings?: Partial<DepthOfFieldSettings>): DepthOfFieldSettings {
  const focusY = Number.isFinite(settings?.focusY)
    ? Math.max(0, Math.min(1, settings!.focusY!))
    : DEFAULT_DEPTH_OF_FIELD_SETTINGS.focusY
  const feather = Number.isFinite(settings?.feather)
    ? Math.max(0, Math.min(4096, settings!.feather!))
    : DEFAULT_DEPTH_OF_FIELD_SETTINGS.feather
  const blurRadius = Number.isFinite(settings?.blurRadius)
    ? Math.max(0, Math.min(64, settings!.blurRadius!))
    : DEFAULT_DEPTH_OF_FIELD_SETTINGS.blurRadius
  return {
    enabled: settings?.enabled ?? DEFAULT_DEPTH_OF_FIELD_SETTINGS.enabled,
    focusY,
    feather,
    blurRadius
  }
}

function normalizeColorGrading(settings?: Partial<ColorGradingSettings>): ColorGradingSettings {
  return {
    enabled: settings?.enabled ?? DEFAULT_COLOR_GRADING_SETTINGS.enabled,
    preset: settings?.preset ?? DEFAULT_COLOR_GRADING_SETTINGS.preset,
    exposure: Number.isFinite(settings?.exposure)
      ? Math.max(-100, Math.min(100, settings!.exposure!))
      : DEFAULT_COLOR_GRADING_SETTINGS.exposure,
    contrast: Number.isFinite(settings?.contrast)
      ? Math.max(-100, Math.min(100, settings!.contrast!))
      : DEFAULT_COLOR_GRADING_SETTINGS.contrast,
    saturation: Number.isFinite(settings?.saturation)
      ? Math.max(-100, Math.min(100, settings!.saturation!))
      : DEFAULT_COLOR_GRADING_SETTINGS.saturation,
    temperature: Number.isFinite(settings?.temperature)
      ? Math.max(-100, Math.min(100, settings!.temperature!))
      : DEFAULT_COLOR_GRADING_SETTINGS.temperature,
    tint: Number.isFinite(settings?.tint)
      ? Math.max(-100, Math.min(100, settings!.tint!))
      : DEFAULT_COLOR_GRADING_SETTINGS.tint
  }
}

function normalizeShaderSettings(settings?: Partial<ShaderSettings>): ShaderSettings {
  return {
    enabled: settings?.enabled ?? DEFAULT_SHADER_SETTINGS.enabled,
    preset: settings?.preset ?? DEFAULT_SHADER_SETTINGS.preset,
    intensity: Number.isFinite(settings?.intensity)
      ? Math.max(0, Math.min(100, settings!.intensity!))
      : DEFAULT_SHADER_SETTINGS.intensity,
    grain: Number.isFinite(settings?.grain)
      ? Math.max(0, Math.min(10, settings!.grain!))
      : DEFAULT_SHADER_SETTINGS.grain,
    aberration: Number.isFinite(settings?.aberration)
      ? Math.max(0, Math.min(1, settings!.aberration!))
      : DEFAULT_SHADER_SETTINGS.aberration,
    scanlines: Number.isFinite(settings?.scanlines)
      ? Math.max(0, Math.min(5, settings!.scanlines!))
      : DEFAULT_SHADER_SETTINGS.scanlines,
    scanlinesDensity: Number.isFinite(settings?.scanlinesDensity)
      ? Math.max(0.2, Math.min(5, settings!.scanlinesDensity!))
      : DEFAULT_SHADER_SETTINGS.scanlinesDensity,
    vignette: Number.isFinite(settings?.vignette)
      ? Math.max(0, Math.min(10, settings!.vignette!))
      : DEFAULT_SHADER_SETTINGS.vignette,
    bloom: Number.isFinite(settings?.bloom)
      ? Math.max(0, Math.min(20, settings!.bloom!))
      : DEFAULT_SHADER_SETTINGS.bloom
  }
}

function normalizeLayerDepthRole(role?: LayerDepthRole): LayerDepthRole {
  return role === 'background' || role === 'subject' ? role : 'auto'
}

function normalizeOpticalDepth(depth?: number): number | undefined {
  return Number.isFinite(depth) ? Math.max(0, Math.min(1, depth!)) : undefined
}

function mergeUniformTransform(current: Transform2D, changes: Partial<Transform2D>): Transform2D {
  let nextScaleX = current.scaleX
  let nextScaleY = current.scaleY

  if (changes.scaleX !== undefined && changes.scaleY !== undefined) {
    const magX = Math.abs(changes.scaleX)
    const magY = Math.abs(changes.scaleY)
    if (magX !== magY) {
      nextScaleX = changes.scaleX
      nextScaleY = magX
    } else {
      nextScaleX = changes.scaleX
      nextScaleY = changes.scaleY
    }
  } else if (changes.scaleX !== undefined) {
    const currentSignX = Math.sign(current.scaleX) || 1
    const newSignX = Math.sign(changes.scaleX) || 1
    nextScaleX = changes.scaleX
    if (Math.abs(changes.scaleX) !== Math.abs(current.scaleX) || currentSignX === newSignX) {
      nextScaleY = Math.abs(changes.scaleX)
    }
  } else if (changes.scaleY !== undefined) {
    const currentSignX = Math.sign(current.scaleX) || 1
    nextScaleY = Math.abs(changes.scaleY)
    nextScaleX = currentSignX * Math.abs(changes.scaleY)
  }

  return normalizeTransform({
    ...current,
    ...changes,
    scaleX: nextScaleX,
    scaleY: nextScaleY
  })
}

function normalizeDocument(document: EditorDocument): EditorDocument {
  return {
    ...document,
    depthOfField: normalizeDepthOfField(document.depthOfField),
    colorGrading: normalizeColorGrading(document.colorGrading),
    shaderSettings: normalizeShaderSettings(document.shaderSettings),
    groups: document.groups.map((group) => ({
      ...group,
      stagePlane: group.stagePlane ?? (group.kind === 'character' ? 'rear' : undefined),
      transform: normalizeTransform(group.transform)
    })),
    layers: document.layers.map((layer) => ({
      ...layer,
      locked: layer.category === 'background_overlay' ? true : layer.locked,
      stagePlane: layer.stagePlane ?? (layer.category === 'props_set' ? 'front' : undefined),
      depthRole: normalizeLayerDepthRole(layer.depthRole),
      opticalDepth: normalizeOpticalDepth(layer.opticalDepth),
      transform: normalizeTransform(layer.transform)
    }))
  }
}

function slugifyCharacter(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'berlu'
  )
}

function createDefaultDocument(projectId = 'proj_default'): EditorDocument {
  const now = Date.now()
  return {
    id: 'doc_default',
    projectId,
    name: 'Document Principal',
    camera: {
      enabled: false,
      x: 0,
      y: 0,
      width: DEFAULT_STAGE_RESOLUTION.width,
      height: DEFAULT_STAGE_RESOLUTION.height,
      aspectRatio: '16:9'
    },
    depthOfField: { ...DEFAULT_DEPTH_OF_FIELD_SETTINGS },
    colorGrading: { ...DEFAULT_COLOR_GRADING_SETTINGS },
    shaderSettings: { ...DEFAULT_SHADER_SETTINGS },
    groups: clone(DEFAULT_EDITOR_GROUPS),
    layers: [],
    createdAt: now,
    updatedAt: now
  }
}

function stateOf(document: EditorDocument): StudioState {
  return clone({
    depthOfField: document.depthOfField,
    colorGrading: document.colorGrading,
    shaderSettings: document.shaderSettings,
    groups: document.groups,
    layers: document.layers,
    rigCatalogSnapshot: document.rigCatalogSnapshot
  })
}

function statesAreEqual(left: StudioState, right: StudioState): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function isCharacterCategory(category: AssetCategory): boolean {
  return ASSET_CATEGORIES[category].placementMode === 'character-anchored'
}

function isFreeAccessoryCategory(category: AssetCategory): boolean {
  return FREE_ACCESSORY_CATEGORIES.includes(
    category as (typeof FREE_ACCESSORY_CATEGORIES)[number]
  )
}

function createCharacterGroup(name: string, key: string, zIndex: number): CharacterGroup {
  return {
    id: generateId('grp_char'),
    name,
    kind: 'character',
    characterKey: key,
    activeMode: 'rig',
    zIndex,
    transform: { ...DEFAULT_TRANSFORM },
    muted: false,
    locked: false,
    collapsed: false,
    color: 'indigo',
    stagePlane: 'rear',
    allowedCategories: [...CHARACTER_CATEGORIES],
    isDefault: false
  }
}

export const useEditorStore = defineStore('editor', () => {
  const currentDocument = ref<EditorDocument>(createDefaultDocument())
  const selectedLayerId = ref<string | null>(null)
  const selectedGroupId = ref<string | null>(null)
  const editScope = ref<'group' | 'layer' | 'head'>('layer')
  const undoStack = ref<StudioHistoryEntry[]>([])
  const redoStack = ref<StudioHistoryEntry[]>([])
  const activeGesture = ref<StudioGesture | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)

  let saveQueue: Promise<void> = Promise.resolve()
  let queuedSaves = 0

  const selectedLayer = computed(
    () => currentDocument.value.layers.find((layer) => layer.id === selectedLayerId.value) ?? null
  )
  const selectedGroup = computed(
    () => currentDocument.value.groups.find((group) => group.id === selectedGroupId.value) ?? null
  )
  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)
  const hasActiveGesture = computed(() => activeGesture.value !== null)

  function accessoriesStageGroup(document = currentDocument.value): EditorGroup {
    const existing = document.groups.find(
      (group) =>
        group.kind === 'stage' &&
        FREE_ACCESSORY_CATEGORIES.some((category) => group.allowedCategories.includes(category))
    )
    if (existing) {
      existing.allowedCategories = Array.from(
        new Set([...existing.allowedCategories, ...FREE_ACCESSORY_CATEGORIES])
      )
      return existing
    }

    const template = DEFAULT_EDITOR_GROUPS.find((group) => group.id === 'grp_accessories')
    const created = clone(
      template ?? {
        id: 'grp_accessories',
        name: 'Accessoires',
        kind: 'stage' as const,
        zIndex: 27,
        transform: DEFAULT_TRANSFORM,
        muted: false,
        locked: false,
        collapsed: false,
        color: 'purple' as const,
        allowedCategories: [...FREE_ACCESSORY_CATEGORIES],
        isDefault: true
      }
    )
    document.groups.push(created)
    return created
  }

  function detachAccessoryTransform(
    layer: EditorLayer,
    group: CharacterGroup,
    asset: Asset
  ): Transform2D {
    const stage = useProjectStore().currentProject.stage
    const rigCatalog = useRigCatalogStore()
    const rig = rigCatalog.rigById(group.activeRigId) ?? rigCatalog.defaultRig(group.characterKey)
    const referenceWidth = Math.max(1, rig?.body.width ?? DEFAULT_RIG_CANVAS.width)
    const referenceHeight = Math.max(1, rig?.body.height ?? DEFAULT_RIG_CANVAS.height)
    const baseScale = Math.min(
      1,
      (stage.width * 0.7) / referenceWidth,
      (stage.height * 0.7) / referenceHeight
    )
    const geometryX = (stage.width - referenceWidth * baseScale) / 2
    const geometryY = (stage.height - referenceHeight * baseScale) / 2
    const groupOriginX = geometryX + (referenceWidth * baseScale) / 2 + group.transform.x
    const groupOriginY = geometryY + (referenceHeight * baseScale) / 2 + group.transform.y
    const layerCenterX =
      geometryX +
      layer.transform.x * baseScale +
      group.transform.x +
      (asset.width * baseScale) / 2
    const layerCenterY =
      geometryY +
      layer.transform.y * baseScale +
      group.transform.y +
      (asset.height * baseScale) / 2
    const radians = (group.transform.rotation * Math.PI) / 180
    const scaledX = (layerCenterX - groupOriginX) * group.transform.scaleX
    const scaledY = (layerCenterY - groupOriginY) * group.transform.scaleY
    const finalCenterX =
      groupOriginX + scaledX * Math.cos(radians) - scaledY * Math.sin(radians)
    const finalCenterY =
      groupOriginY + scaledX * Math.sin(radians) + scaledY * Math.cos(radians)

    return {
      x: Math.round(finalCenterX - asset.width / 2),
      y: Math.round(finalCenterY - asset.height / 2),
      scaleX: layer.transform.scaleX * baseScale * group.transform.scaleX,
      scaleY: layer.transform.scaleY * baseScale * group.transform.scaleY,
      rotation: layer.transform.rotation + group.transform.rotation,
      opacity: Math.max(0, Math.min(1, layer.transform.opacity * group.transform.opacity))
    }
  }

  function normalizeAndDetachAccessories(document: EditorDocument): {
    document: EditorDocument
    changed: boolean
  } {
    const normalized = normalizeDocument(document)
    const hadAccessoriesGroup = normalized.groups.some(
      (group) => group.kind === 'stage' && group.id === 'grp_accessories'
    )
    const targetGroup = accessoriesStageGroup(normalized)
    const assets = new Map(useAssetStore().assets.map((asset) => [asset.id, asset]))
    const groups = new Map(normalized.groups.map((group) => [group.id, group]))
    let changed = !hadAccessoriesGroup

    for (const group of normalized.groups) {
      if (group.kind !== 'character') continue
      const filtered = group.allowedCategories.filter((category) => !isFreeAccessoryCategory(category))
      if (filtered.length !== group.allowedCategories.length) {
        group.allowedCategories = filtered
        changed = true
      }
    }

    for (const layer of normalized.layers) {
      if (!isFreeAccessoryCategory(layer.category)) continue
      const sourceGroup = groups.get(layer.groupId)
      if (sourceGroup?.kind !== 'character') continue
      const asset = assets.get(layer.assetId)
      if (asset) layer.transform = detachAccessoryTransform(layer, sourceGroup, asset)
      layer.groupId = targetGroup.id
      layer.depthRole = 'subject'
      changed = true
    }

    return { document: normalized, changed }
  }

  function restoreRigCatalogSnapshot(snapshot?: string): void {
    if (!snapshot) return
    try {
      useRigCatalogStore().importCatalog(snapshot, useAssetStore().assets)
    } catch (error) {
      console.warn('Snapshot de rigs ignoré car invalide :', error)
    }
  }

  function persistCurrentDocument(): Promise<void> {
    const snapshot = clone(currentDocument.value)
    snapshot.updatedAt = Date.now()
    queuedSaves += 1
    isSaving.value = true
    saveQueue = saveQueue
      .catch(() => undefined)
      .then(() => editorDocumentRepository.save(snapshot))
      .finally(() => {
        queuedSaves -= 1
        isSaving.value = queuedSaves > 0
      })
    return saveQueue
  }

  function persistInBackground(): void {
    void persistCurrentDocument().catch((error) => {
      console.error('Échec de sauvegarde du document :', error)
    })
  }

  async function flushPersistence(): Promise<void> {
    await saveQueue
  }

  function pushHistory(label: string, before: StudioState, after: StudioState): void {
    if (statesAreEqual(before, after)) return
    undoStack.value.push({ label, before, after })
    if (undoStack.value.length > MAX_HISTORY) undoStack.value.shift()
    redoStack.value = []
  }

  function mutateStudio<T>(label: string, mutation: () => T): T {
    const before = activeGesture.value ? null : stateOf(currentDocument.value)
    const result = mutation()
    if (before) pushHistory(label, before, stateOf(currentDocument.value))
    if (!activeGesture.value) persistInBackground()
    return result
  }

  function beginGesture(label = 'Transformer le studio'): void {
    if (activeGesture.value) return
    activeGesture.value = { label, before: stateOf(currentDocument.value) }
  }

  function endGesture(): void {
    const gesture = activeGesture.value
    if (!gesture) return
    activeGesture.value = null
    const after = stateOf(currentDocument.value)
    pushHistory(gesture.label, gesture.before, after)
    if (!statesAreEqual(gesture.before, after)) persistInBackground()
  }

  function cancelGesture(): void {
    const gesture = activeGesture.value
    if (!gesture) return
    currentDocument.value.groups = clone(gesture.before.groups)
    currentDocument.value.layers = clone(gesture.before.layers)
    currentDocument.value.depthOfField = clone(gesture.before.depthOfField)
    currentDocument.value.colorGrading = clone(gesture.before.colorGrading)
    currentDocument.value.shaderSettings = clone(gesture.before.shaderSettings)
    activeGesture.value = null
  }

  function clearHistory(): void {
    activeGesture.value = null
    undoStack.value = []
    redoStack.value = []
  }

  function restoreState(state: StudioState): void {
    currentDocument.value.depthOfField = clone(state.depthOfField)
    currentDocument.value.colorGrading = clone(state.colorGrading)
    currentDocument.value.shaderSettings = clone(state.shaderSettings)
    currentDocument.value.groups = clone(state.groups)
    currentDocument.value.layers = clone(state.layers)
    currentDocument.value.rigCatalogSnapshot = state.rigCatalogSnapshot
    restoreRigCatalogSnapshot(state.rigCatalogSnapshot)
    if (
      selectedLayerId.value &&
      !currentDocument.value.layers.some((l) => l.id === selectedLayerId.value)
    ) {
      clearStudioSelection()
    }
    if (
      selectedGroupId.value &&
      !currentDocument.value.groups.some((g) => g.id === selectedGroupId.value)
    ) {
      selectedGroupId.value = null
    }
  }

  function undo(): void {
    endGesture()
    const entry = undoStack.value.pop()
    if (!entry) return
    restoreState(entry.before)
    redoStack.value.push(entry)
    persistInBackground()
  }

  function redo(): void {
    endGesture()
    const entry = redoStack.value.pop()
    if (!entry) return
    restoreState(entry.after)
    undoStack.value.push(entry)
    persistInBackground()
  }

  async function loadDocument(
    documentId: string,
    projectId = 'proj_default'
  ): Promise<EditorDocument> {
    isLoading.value = true
    try {
      const existing = await editorDocumentRepository.getById(documentId)
      if (existing) {
        const migrated = normalizeAndDetachAccessories(existing)
        currentDocument.value = migrated.document
        if (migrated.changed) await editorDocumentRepository.save(currentDocument.value)
      } else {
        const projectDocuments = await editorDocumentRepository.getByProjectId(projectId)
        const source = projectDocuments[0] ?? createDefaultDocument(projectId)
        const migrated = normalizeAndDetachAccessories(source)
        currentDocument.value = migrated.document
        currentDocument.value.id = documentId || 'doc_default'
        if (projectDocuments.length === 0 || migrated.changed)
          await editorDocumentRepository.save(currentDocument.value)
      }
      clearStudioSelection()
      clearHistory()
      restoreRigCatalogSnapshot(currentDocument.value.rigCatalogSnapshot)
      return currentDocument.value
    } finally {
      isLoading.value = false
    }
  }

  async function saveDocument(): Promise<void> {
    endGesture()
    await persistCurrentDocument()
  }

  function resolveAsset(assetId: string): Asset | undefined {
    try {
      return useAssetStore().assets.find((asset) => asset.id === assetId)
    } catch {
      return undefined
    }
  }

  function findOrCreateCharacterGroup(
    asset?: Asset,
    targetGroupId?: string | null
  ): CharacterGroup {
    const targeted = targetGroupId
      ? currentDocument.value.groups.find(
          (group): group is CharacterGroup =>
            group.id === targetGroupId && group.kind === 'character'
        )
      : undefined
    if (targeted) return targeted

    const name = asset?.character?.name?.trim() || 'Berlu'
    const key = asset?.character?.key || slugifyCharacter(name)
    const existing = currentDocument.value.groups.find(
      (group): group is CharacterGroup => group.kind === 'character' && group.characterKey === key
    )
    if (existing) return existing

    const maxZ = currentDocument.value.groups.reduce((max, group) => Math.max(max, group.zIndex), 0)
    const created = createCharacterGroup(name, key, Math.max(20, maxZ + 1))
    currentDocument.value.groups.push(created)
    return created
  }

  function findStageGroup(category: AssetCategory, targetGroupId?: string | null): EditorGroup {
    const targeted = targetGroupId
      ? currentDocument.value.groups.find(
          (group) => group.id === targetGroupId && group.kind === 'stage'
        )
      : undefined
    if (targeted) return targeted
    const matching = currentDocument.value.groups.find(
      (group) => group.kind === 'stage' && group.allowedCategories.includes(category)
    )
    if (matching) return matching
    if (isFreeAccessoryCategory(category)) return accessoriesStageGroup()
    return (
      currentDocument.value.groups.find((group) => group.kind === 'stage') ??
      currentDocument.value.groups[0]
    )
  }

  function assignAssetToGroup(
    assetId: string,
    category: AssetCategory,
    targetGroupId?: string | null,
    name?: string,
    calibrationOverride?: AssetCalibration
  ): EditorLayer {
    return mutateStudio('Assigner un asset', () => {
      const asset = resolveAsset(assetId)
      const group = isCharacterCategory(category)
        ? findOrCreateCharacterGroup(asset, targetGroupId)
        : findStageGroup(category, targetGroupId)
      const singleton =
        ASSET_CATEGORIES[category].layerCardinality === 'singleton' ||
        (isCharacterCategory(category) && category !== 'props_character') ||
        category === 'props_character'
      const existing = singleton
        ? currentDocument.value.layers.find(
            (layer) =>
              layer.groupId === group.id &&
              layer.category === category &&
              (category !== 'props_character' ||
                layer.characterPropSlot === asset?.characterPropSlot)
          )
        : undefined
      const calibration = calibrationOverride ?? asset?.calibration

      if (existing) {
        existing.assetId = assetId
        existing.name = name || asset?.name || existing.name
        existing.headSeriesId = asset?.headSeriesId
        existing.characterPropSlot = asset?.characterPropSlot
        existing.muted = false
        if (group.kind === 'character') {
          existing.transform = normalizeTransform(calibration)
          existing.zIndex = calibration?.zIndex ?? ASSET_CATEGORIES[category].defaultZIndex
        } else if (calibration) {
          existing.transform = normalizeTransform(calibration)
          existing.zIndex = calibration.zIndex ?? existing.zIndex
        }
        if (group.kind === 'character') {
          group.activeMode = category === 'perso' ? 'full' : 'rig'
          group.muted = false
        }
        selectedLayerId.value = group.kind === 'character' ? null : existing.id
        selectedGroupId.value = group.id
        editScope.value = group.kind === 'character' ? 'group' : 'layer'
        return existing
      }

      const nextOrder =
        currentDocument.value.layers.reduce((max, layer) => Math.max(max, layer.order), -1) + 1
      const layer: EditorLayer = {
        id: generateId('layer'),
        assetId,
        name: name || asset?.name || ASSET_CATEGORIES[category].label,
        category,
        groupId: group.id,
        zIndex: calibration?.zIndex ?? ASSET_CATEGORIES[category].defaultZIndex,
        order: nextOrder,
        muted: false,
        locked: category === 'background_overlay',
        stagePlane: category === 'props_set' ? 'front' : undefined,
        headSeriesId: asset?.headSeriesId,
        characterPropSlot: asset?.characterPropSlot,
        depthRole: 'auto',
        transform: normalizeTransform(calibration)
      }
      if (!calibration && group.kind === 'stage' && category !== 'background' && asset) {
        const stage = useProjectStore().currentProject.stage
        layer.transform.x = Math.round((stage.width - asset.width) / 2)
        layer.transform.y = Math.round((stage.height - asset.height) / 2)
      }
      currentDocument.value.layers.push(layer)
      if (group.kind === 'character') {
        group.activeMode = category === 'perso' ? 'full' : 'rig'
        group.muted = false
      }
      selectedLayerId.value = group.kind === 'character' ? null : layer.id
      selectedGroupId.value = group.id
      editScope.value = group.kind === 'character' ? 'group' : 'layer'
      return layer
    })
  }

  function applyCharacterRig(
    groupId: string,
    rigId: string,
    presets: CharacterRigLayerPreset[],
    selectedAssetId?: string
  ): EditorLayer | null {
    return mutateStudio('Changer le rig du personnage', () => {
      const group = currentDocument.value.groups.find(
        (candidate): candidate is CharacterGroup =>
          candidate.id === groupId && candidate.kind === 'character'
      )
      if (!group) return null

      currentDocument.value.layers = currentDocument.value.layers.filter(
        (layer) => layer.groupId !== group.id || layer.category === 'perso'
      )
      let nextOrder =
        currentDocument.value.layers.reduce((max, layer) => Math.max(max, layer.order), -1) + 1
      const created: EditorLayer[] = presets.map((preset) => {
        const asset = resolveAsset(preset.assetId)
        return {
        id: generateId('layer'),
        assetId: preset.assetId,
        name: preset.name,
        category: preset.category,
        groupId: group.id,
        zIndex: preset.calibration.zIndex ?? ASSET_CATEGORIES[preset.category].defaultZIndex,
        order: nextOrder++,
        muted: false,
        locked: false,
        headSeriesId: asset?.headSeriesId,
        characterPropSlot: asset?.characterPropSlot,
        depthRole: 'auto',
        transform: normalizeTransform(preset.calibration)
        }
      })
      currentDocument.value.layers.push(...created)
      group.activeMode = 'rig'
      group.activeRigId = rigId
      group.muted = false
      selectedLayerId.value = null
      selectedGroupId.value = group.id
      editScope.value = 'group'
      return (
        created.find((layer) => layer.assetId === selectedAssetId) ??
        created.find((layer) => layer.category === 'body') ??
        created[0] ??
        null
      )
    })
  }

  function toggleAssetInViewport(
    assetId: string,
    category: AssetCategory,
    name?: string
  ): EditorLayer | null {
    const asset = resolveAsset(assetId)
    const characterKey = asset?.character?.key || 'berlu'
    const group = isCharacterCategory(category)
      ? currentDocument.value.groups.find(
          (candidate): candidate is CharacterGroup =>
            candidate.kind === 'character' && candidate.characterKey === characterKey
        )
      : findStageGroup(category)
    const existing = group
      ? currentDocument.value.layers.find(
          (layer) =>
            layer.groupId === group.id && layer.category === category && layer.assetId === assetId
        )
      : undefined
    const compatibleMode =
      group?.kind !== 'character' ||
      (group.activeMode === 'full') === (category === 'perso')
    const isVisible = Boolean(existing && !existing.muted && !group?.muted && compatibleMode)

    if (existing && isVisible) {
      removeLayer(existing.id)
      assetStoreSelectionAfterToggle(null)
      return null
    }

    if (existing && group) {
      return mutateStudio('Afficher un asset', () => {
        existing.muted = false
        group.muted = false
        if (group.kind === 'character') {
          group.activeMode = category === 'perso' ? 'full' : 'rig'
        }
        selectedLayerId.value = group.kind === 'character' ? null : existing.id
        selectedGroupId.value = group.id
        editScope.value = group.kind === 'character' ? 'group' : 'layer'
        return existing
      })
    }

    return assignAssetToGroup(assetId, category, null, name)
  }

  function assetStoreSelectionAfterToggle(assetId: string | null): void {
    try {
      useAssetStore().selectAsset(assetId)
    } catch {
      // Le store d'assets peut ne pas être initialisé dans certains tests isolés.
    }
  }

  function addLayer(layer: Omit<EditorLayer, 'id'> & { id?: string }): EditorLayer {
    return mutateStudio('Ajouter un calque', () => {
      const created = {
        ...layer,
        id: layer.id || generateId('layer'),
        depthRole: normalizeLayerDepthRole(layer.depthRole),
        opticalDepth: normalizeOpticalDepth(layer.opticalDepth),
        transform: normalizeTransform(layer.transform)
      } as EditorLayer
      currentDocument.value.layers.push(created)
      return created
    })
  }

  function removeLayer(layerId: string): void {
    mutateStudio('Retirer un calque', () => {
      currentDocument.value.layers = currentDocument.value.layers.filter(
        (layer) => layer.id !== layerId
      )
      if (selectedLayerId.value === layerId) clearStudioSelection()
    })
  }

  function removeActiveCharacterRepresentation(groupId: string): number {
    return mutateStudio('Retirer la représentation du personnage', () => {
      const group = currentDocument.value.groups.find(
        (candidate): candidate is CharacterGroup =>
          candidate.id === groupId && candidate.kind === 'character'
      )
      if (!group) return 0

      const removesLayer = (layer: EditorLayer) =>
        layer.groupId === group.id &&
        (group.activeMode === 'full'
          ? layer.category === 'perso'
          : layer.category !== 'perso')
      const removedCount = currentDocument.value.layers.filter(removesLayer).length
      currentDocument.value.layers = currentDocument.value.layers.filter(
        (layer) => !removesLayer(layer)
      )
      if (selectedGroupId.value === group.id) clearStudioSelection()
      return removedCount
    })
  }

  function updateLayer(
    layerId: string,
    changes: Partial<EditorLayer>,
    label = 'Modifier un calque'
  ): void {
    mutateStudio(label, () => {
      const layer = currentDocument.value.layers.find((candidate) => candidate.id === layerId)
      if (layer) Object.assign(layer, changes)
    })
  }

  function updateLayerTransform(layerId: string, transform: Partial<Transform2D>): void {
    const apply = () => {
      const layer = currentDocument.value.layers.find((candidate) => candidate.id === layerId)
      if (layer) layer.transform = mergeUniformTransform(layer.transform, transform)
    }
    if (activeGesture.value) apply()
    else mutateStudio('Transformer un calque', apply)
  }

  function toggleLayerHorizontalFlip(layerId: string): void {
    mutateStudio('Retourner horizontalement un calque', () => {
      const layer = currentDocument.value.layers.find((candidate) => candidate.id === layerId)
      if (!layer) return
      layer.transform = {
        ...layer.transform,
        scaleX: -layer.transform.scaleX
      }
    })
  }

  function updateLayerSettings(
    layerId: string,
    transform: Partial<Transform2D>,
    zIndex: number
  ): void {
    mutateStudio('Régler un calque', () => {
      const layer = currentDocument.value.layers.find((candidate) => candidate.id === layerId)
      if (!layer) return
      layer.transform = mergeUniformTransform(layer.transform, transform)
      layer.zIndex = zIndex
    })
  }

  function updateLayerZIndex(layerId: string, zIndex: number): void {
    updateLayer(layerId, { zIndex }, 'Changer la profondeur d’un calque')
  }

  function setLayerMuted(layerId: string, muted: boolean): void {
    updateLayer(layerId, { muted }, muted ? 'Masquer un calque' : 'Afficher un calque')
  }

  function setLayerLocked(layerId: string, locked: boolean): void {
    updateLayer(layerId, { locked }, locked ? 'Verrouiller un calque' : 'Déverrouiller un calque')
  }

  function setLayerDepthRole(layerId: string, depthRole: LayerDepthRole): void {
    const normalizedRole = normalizeLayerDepthRole(depthRole)
    updateLayer(
      layerId,
      { depthRole: normalizedRole, opticalDepth: undefined },
      normalizedRole === 'background'
        ? 'Placer dans le décor'
        : normalizedRole === 'subject'
          ? 'Garder le sujet net'
          : 'Rétablir la distance automatique'
    )
  }

  function setLayerOpticalDepth(layerId: string, opticalDepth: number): void {
    updateLayer(
      layerId,
      { opticalDepth: normalizeOpticalDepth(opticalDepth) },
      'Régler la distance caméra'
    )
  }

  function setGroupDepthRole(groupId: string, depthRole: LayerDepthRole): void {
    const normalizedRole = normalizeLayerDepthRole(depthRole)
    mutateStudio(
      normalizedRole === 'background'
        ? 'Placer le groupe dans le décor'
        : normalizedRole === 'subject'
          ? 'Garder le groupe net'
          : 'Rétablir la distance automatique du groupe',
      () => {
        const group = currentDocument.value.groups.find((candidate) => candidate.id === groupId)
        if (!group) return
        group.depthRole = normalizedRole
        group.opticalDepth = undefined
        for (const layer of currentDocument.value.layers) {
          if (layer.groupId === groupId) {
            layer.depthRole = normalizedRole
            layer.opticalDepth = undefined
          }
        }
      }
    )
  }

  function setGroupOpticalDepth(groupId: string, opticalDepth: number): void {
    const normalized = normalizeOpticalDepth(opticalDepth)
    mutateStudio('Régler la distance caméra du groupe', () => {
      const group = currentDocument.value.groups.find((candidate) => candidate.id === groupId)
      if (!group) return
      group.opticalDepth = normalized
      for (const layer of currentDocument.value.layers) {
        if (layer.groupId === groupId) {
          layer.opticalDepth = normalized
        }
      }
    })
  }

  function moveLayer(layerId: string, direction: -1 | 1): void {
    mutateStudio(direction > 0 ? 'Monter un calque' : 'Descendre un calque', () => {
      const layer = currentDocument.value.layers.find((candidate) => candidate.id === layerId)
      if (!layer) return
      const siblings = currentDocument.value.layers
        .filter((candidate) => candidate.groupId === layer.groupId)
        .sort((left, right) => left.order - right.order)
      const index = siblings.findIndex((candidate) => candidate.id === layerId)
      const target = siblings[index + direction]
      if (!target) return
      const order = layer.order
      layer.order = target.order
      target.order = order
    })
  }

  function updateGroup(
    groupId: string,
    changes: Partial<EditorGroup>,
    label = 'Modifier un groupe'
  ): void {
    mutateStudio(label, () => {
      const group = currentDocument.value.groups.find((candidate) => candidate.id === groupId)
      if (group) Object.assign(group, changes)
    })
  }

  function updateGroupTransform(groupId: string, transform: Partial<Transform2D>): void {
    const apply = () => {
      const group = currentDocument.value.groups.find((candidate) => candidate.id === groupId)
      if (group) group.transform = mergeUniformTransform(group.transform, transform)
    }
    if (activeGesture.value) apply()
    else mutateStudio('Transformer un groupe', apply)
  }

  function toggleGroupHorizontalFlip(groupId: string): void {
    mutateStudio('Retourner horizontalement un groupe', () => {
      const group = currentDocument.value.groups.find((candidate) => candidate.id === groupId)
      if (!group) return
      group.transform = {
        ...group.transform,
        scaleX: -group.transform.scaleX
      }
    })
  }

  function setGroupMuted(groupId: string, muted: boolean): void {
    updateGroup(groupId, { muted }, muted ? 'Masquer un groupe' : 'Afficher un groupe')
  }

  function toggleGroupMuted(groupId: string): void {
    const group = currentDocument.value.groups.find((candidate) => candidate.id === groupId)
    if (group) setGroupMuted(groupId, !group.muted)
  }

  function setGroupLocked(groupId: string, locked: boolean): void {
    updateGroup(groupId, { locked }, locked ? 'Verrouiller un groupe' : 'Déverrouiller un groupe')
  }

  function setGroupCollapsed(groupId: string, collapsed: boolean): void {
    updateGroup(groupId, { collapsed }, collapsed ? 'Replier un groupe' : 'Déplier un groupe')
  }

  function setCharacterMode(groupId: string, activeMode: CharacterMode): void {
    mutateStudio(
      activeMode === 'full' ? 'Afficher le personnage complet' : 'Afficher le rig',
      () => {
        const group = currentDocument.value.groups.find(
          (candidate): candidate is CharacterGroup =>
            candidate.id === groupId && candidate.kind === 'character'
        )
        if (group) group.activeMode = activeMode
      }
    )
  }

  function updateCamera(camera: CameraFrame): void {
    currentDocument.value.camera = { ...camera }
    persistInBackground()
  }

  function updateDepthOfField(changes: Partial<DepthOfFieldSettings>): void {
    mutateStudio('Régler la profondeur de champ', () => {
      currentDocument.value.depthOfField = normalizeDepthOfField({
        ...currentDocument.value.depthOfField,
        ...changes
      })
    })
  }

  function updateColorGrading(
    changes: Partial<ColorGradingSettings>,
    label = 'Régler le color grading'
  ): void {
    mutateStudio(label, () => {
      currentDocument.value.colorGrading = normalizeColorGrading({
        ...currentDocument.value.colorGrading,
        ...changes
      })
    })
  }

  function resetColorGrading(): void {
    updateColorGrading({ ...DEFAULT_COLOR_GRADING_SETTINGS }, 'Réinitialiser le color grading')
  }

  function updateShaderSettings(
    changes: Partial<ShaderSettings>,
    label = 'Régler les effets de shader'
  ): void {
    mutateStudio(label, () => {
      currentDocument.value.shaderSettings = normalizeShaderSettings({
        ...currentDocument.value.shaderSettings,
        ...changes
      })
    })
  }

  function resetShaderSettings(): void {
    updateShaderSettings({ ...DEFAULT_SHADER_SETTINGS }, 'Réinitialiser les shaders')
  }

  function resetVisualEffects(): void {
    mutateStudio('Réinitialiser les effets visuels', () => {
      currentDocument.value.colorGrading = { ...DEFAULT_COLOR_GRADING_SETTINGS }
      currentDocument.value.shaderSettings = { ...DEFAULT_SHADER_SETTINGS }
    })
  }

  function selectLayerForEditing(layerId: string): void {
    const layer = currentDocument.value.layers.find((candidate) => candidate.id === layerId)
    if (!layer) return
    const group = currentDocument.value.groups.find((candidate) => candidate.id === layer.groupId)
    if (group?.kind === 'character') {
      selectGroupForEditing(group.id)
      return
    }
    selectedLayerId.value = layerId
    selectedGroupId.value = layer.groupId
    editScope.value = 'layer'
  }

  function selectRigLayerForCalibration(layerId: string): void {
    const layer = currentDocument.value.layers.find((candidate) => candidate.id === layerId)
    if (!layer) return
    const group = currentDocument.value.groups.find((candidate) => candidate.id === layer.groupId)
    if (group?.kind !== 'character') return
    selectedLayerId.value = layerId
    selectedGroupId.value = group.id
    editScope.value = 'layer'
  }

  function selectHeadForEditing(layerId: string): void {
    const layer = currentDocument.value.layers.find((candidate) => candidate.id === layerId)
    if (!layer || layer.category !== 'head') return
    const group = currentDocument.value.groups.find((candidate) => candidate.id === layer.groupId)
    if (group?.kind !== 'character' || group.activeMode !== 'rig') return
    selectedLayerId.value = layer.id
    selectedGroupId.value = group.id
    editScope.value = 'head'
  }

  function selectGroupForEditing(groupId: string): void {
    const group = currentDocument.value.groups.find((candidate) => candidate.id === groupId)
    if (!group) return
    if (group.kind !== 'character') {
      clearStudioSelection()
      return
    }
    selectedGroupId.value = groupId
    selectedLayerId.value = null
    editScope.value = 'group'
  }

  function clearStudioSelection(): void {
    selectedLayerId.value = null
    selectedGroupId.value = null
    editScope.value = 'layer'
  }

  function applyViewportSnapshot(snapshot: ViewportSnapshot): number {
    currentDocument.value.camera = clone(snapshot.camera)
    currentDocument.value.depthOfField = normalizeDepthOfField(snapshot.depthOfField)
    currentDocument.value.colorGrading = normalizeColorGrading(snapshot.colorGrading)
    currentDocument.value.shaderSettings = normalizeShaderSettings(snapshot.shaderSettings)
    const migrated = normalizeAndDetachAccessories({
      ...currentDocument.value,
      groups: clone(snapshot.groups),
      layers: clone(snapshot.layers),
      rigCatalogSnapshot: snapshot.rigCatalogSnapshot
    })
    currentDocument.value.groups = migrated.document.groups
    currentDocument.value.layers = migrated.document.layers
    currentDocument.value.rigCatalogSnapshot = migrated.document.rigCatalogSnapshot
    restoreRigCatalogSnapshot(currentDocument.value.rigCatalogSnapshot)
    clearStudioSelection()
    clearHistory()
    persistInBackground()
    return currentDocument.value.layers.length
  }

  function syncAfterAssetDeletion(assetId: string): void {
    const affectedGroupIds = new Set(
      currentDocument.value.layers
        .filter((layer) => layer.assetId === assetId)
        .map((layer) => layer.groupId)
    )
    currentDocument.value.layers = currentDocument.value.layers.filter(
      (layer) => layer.assetId !== assetId
    )
    for (const groupId of affectedGroupIds) {
      const group = currentDocument.value.groups.find(
        (candidate): candidate is CharacterGroup =>
          candidate.id === groupId && candidate.kind === 'character'
      )
      if (!group || group.activeMode !== 'full') continue
      const hasFull = currentDocument.value.layers.some(
        (layer) => layer.groupId === group.id && layer.category === 'perso'
      )
      const hasRig = currentDocument.value.layers.some(
        (layer) => layer.groupId === group.id && layer.category !== 'perso'
      )
      if (!hasFull && hasRig) group.activeMode = 'rig'
    }
    clearStudioSelection()
    clearHistory()
  }

  function syncRigCatalogSnapshot(snapshot: string): void {
    if (currentDocument.value.rigCatalogSnapshot === snapshot) return
    currentDocument.value.rigCatalogSnapshot = snapshot
    if (!activeGesture.value) persistInBackground()
  }

  return {
    currentDocument,
    selectedLayerId,
    selectedGroupId,
    editScope,
    isLoading,
    isSaving,
    selectedLayer,
    selectedGroup,
    canUndo,
    canRedo,
    hasActiveGesture,
    loadDocument,
    saveDocument,
    flushPersistence,
    assignAssetToGroup,
    applyCharacterRig,
    toggleAssetInViewport,
    addLayer,
    removeLayer,
    removeActiveCharacterRepresentation,
    updateLayer,
    updateLayerTransform,
    toggleLayerHorizontalFlip,
    updateLayerSettings,
    updateLayerZIndex,
    setLayerMuted,
    setLayerLocked,
    setLayerDepthRole,
    setLayerOpticalDepth,
    setGroupDepthRole,
    setGroupOpticalDepth,
    moveLayer,
    updateGroup,
    updateGroupTransform,
    toggleGroupHorizontalFlip,
    setGroupMuted,
    toggleGroupMuted,
    setGroupLocked,
    setGroupCollapsed,
    setCharacterMode,
    updateCamera,
    updateDepthOfField,
    updateColorGrading,
    resetColorGrading,
    updateShaderSettings,
    resetShaderSettings,
    resetVisualEffects,
    selectLayerForEditing,
    selectRigLayerForCalibration,
    selectHeadForEditing,
    selectGroupForEditing,
    clearStudioSelection,
    beginGesture,
    endGesture,
    cancelGesture,
    undo,
    redo,
    clearHistory,
    applyViewportSnapshot,
    syncAfterAssetDeletion,
    syncRigCatalogSnapshot
  }
})
