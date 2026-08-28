import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  CameraFrame,
  CharacterGroup,
  CharacterMode,
  EditorDocument,
  EditorGroup,
  EditorGroupColor,
  EditorLayer,
  Transform2D,
  ViewportSnapshot
} from '@core/types/editor.types'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import {
  CHARACTER_CATEGORIES,
  DEFAULT_EDITOR_GROUPS,
  DEFAULT_STAGE_RESOLUTION,
  DEFAULT_TRANSFORM
} from '@core/constants/editor'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { editorDocumentRepository } from '@infrastructure/db/repositories/editor-document.repository'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { generateId } from '@/lib/utils'

interface StudioState {
  groups: EditorGroup[]
  layers: EditorLayer[]
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

const MAX_HISTORY = 50

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function normalizeTransform(transform?: Partial<Transform2D>): Transform2D {
  const scale = transform?.scaleX ?? transform?.scaleY ?? DEFAULT_TRANSFORM.scaleX
  return { ...DEFAULT_TRANSFORM, ...(transform ?? {}), scaleX: scale, scaleY: scale }
}

function mergeUniformTransform(
  current: Transform2D,
  changes: Partial<Transform2D>
): Transform2D {
  const scale = changes.scaleX ?? changes.scaleY
  return normalizeTransform({
    ...current,
    ...changes,
    ...(scale === undefined ? {} : { scaleX: scale, scaleY: scale })
  })
}

function normalizeDocument(document: EditorDocument): EditorDocument {
  return {
    ...document,
    groups: document.groups.map((group) => ({
      ...group,
      transform: normalizeTransform(group.transform)
    })),
    layers: document.layers.map((layer) => ({
      ...layer,
      transform: normalizeTransform(layer.transform)
    }))
  }
}

function slugifyCharacter(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'berlu'
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
    groups: clone(DEFAULT_EDITOR_GROUPS),
    layers: [],
    createdAt: now,
    updatedAt: now
  }
}

function stateOf(document: EditorDocument): StudioState {
  return clone({ groups: document.groups, layers: document.layers })
}

function statesAreEqual(left: StudioState, right: StudioState): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function isCharacterCategory(category: AssetCategory): boolean {
  return ASSET_CATEGORIES[category].placementMode === 'character-anchored'
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
    allowedCategories: [...CHARACTER_CATEGORIES],
    isDefault: false
  }
}

export const useEditorStore = defineStore('editor', () => {
  const currentDocument = ref<EditorDocument>(createDefaultDocument())
  const selectedLayerId = ref<string | null>(null)
  const selectedGroupId = ref<string | null>(null)
  const editScope = ref<'group' | 'layer'>('layer')
  const undoStack = ref<StudioHistoryEntry[]>([])
  const redoStack = ref<StudioHistoryEntry[]>([])
  const activeGesture = ref<StudioGesture | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)

  let saveQueue: Promise<void> = Promise.resolve()
  let queuedSaves = 0

  const selectedLayer = computed(() =>
    currentDocument.value.layers.find((layer) => layer.id === selectedLayerId.value) ?? null
  )
  const selectedGroup = computed(() =>
    currentDocument.value.groups.find((group) => group.id === selectedGroupId.value) ?? null
  )
  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)
  const hasActiveGesture = computed(() => activeGesture.value !== null)

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
    activeGesture.value = null
  }

  function clearHistory(): void {
    activeGesture.value = null
    undoStack.value = []
    redoStack.value = []
  }

  function restoreState(state: StudioState): void {
    currentDocument.value.groups = clone(state.groups)
    currentDocument.value.layers = clone(state.layers)
    if (selectedLayerId.value && !currentDocument.value.layers.some((l) => l.id === selectedLayerId.value)) {
      selectedLayerId.value = null
    }
    if (selectedGroupId.value && !currentDocument.value.groups.some((g) => g.id === selectedGroupId.value)) {
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

  async function loadDocument(documentId: string, projectId = 'proj_default'): Promise<EditorDocument> {
    isLoading.value = true
    try {
      const existing = await editorDocumentRepository.getById(documentId)
      if (existing) {
        currentDocument.value = normalizeDocument(existing)
      } else {
        const projectDocuments = await editorDocumentRepository.getByProjectId(projectId)
        currentDocument.value = projectDocuments[0] ?? createDefaultDocument(projectId)
        currentDocument.value.id = documentId || 'doc_default'
        if (projectDocuments.length === 0) await editorDocumentRepository.save(currentDocument.value)
      }
      clearStudioSelection()
      clearHistory()
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

  function findOrCreateCharacterGroup(asset?: Asset, targetGroupId?: string | null): CharacterGroup {
    const targeted = targetGroupId
      ? currentDocument.value.groups.find((group): group is CharacterGroup => group.id === targetGroupId && group.kind === 'character')
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
      ? currentDocument.value.groups.find((group) => group.id === targetGroupId && group.kind === 'stage')
      : undefined
    if (targeted) return targeted
    const matching = currentDocument.value.groups.find(
      (group) => group.kind === 'stage' && group.allowedCategories.includes(category)
    )
    if (matching) return matching
    return currentDocument.value.groups.find((group) => group.kind === 'stage') ?? currentDocument.value.groups[0]
  }

  function assignAssetToGroup(
    assetId: string,
    category: AssetCategory,
    targetGroupId?: string | null,
    name?: string
  ): EditorLayer {
    return mutateStudio('Assigner un asset', () => {
      const asset = resolveAsset(assetId)
      const group = isCharacterCategory(category)
        ? findOrCreateCharacterGroup(asset, targetGroupId)
        : findStageGroup(category, targetGroupId)
      const singleton = ASSET_CATEGORIES[category].layerCardinality === 'singleton' || isCharacterCategory(category)
      const existing = singleton
        ? currentDocument.value.layers.find((layer) => layer.groupId === group.id && layer.category === category)
        : undefined
      const calibration = asset?.calibration

      if (existing) {
        existing.assetId = assetId
        existing.name = name || asset?.name || existing.name
        existing.muted = false
        if (calibration) {
          existing.transform = normalizeTransform(calibration)
          existing.zIndex = calibration.zIndex ?? existing.zIndex
        }
        if (group.kind === 'character') {
          group.activeMode = category === 'character_full' ? 'full' : 'rig'
          group.muted = false
        }
        selectedLayerId.value = group.kind === 'character' ? null : existing.id
        selectedGroupId.value = group.id
        editScope.value = group.kind === 'character' ? 'group' : 'layer'
        return existing
      }

      const nextOrder = currentDocument.value.layers.reduce((max, layer) => Math.max(max, layer.order), -1) + 1
      const layer: EditorLayer = {
        id: generateId('layer'),
        assetId,
        name: name || asset?.name || ASSET_CATEGORIES[category].label,
        category,
        groupId: group.id,
        zIndex: calibration?.zIndex ?? ASSET_CATEGORIES[category].defaultZIndex,
        order: nextOrder,
        muted: false,
        locked: false,
        transform: normalizeTransform(calibration)
      }
      if (!calibration && group.kind === 'stage' && category !== 'background' && asset) {
        const stage = useProjectStore().currentProject.stage
        layer.transform.x = Math.round((stage.width - asset.width) / 2)
        layer.transform.y = Math.round((stage.height - asset.height) / 2)
      }
      currentDocument.value.layers.push(layer)
      if (group.kind === 'character') {
        group.activeMode = category === 'character_full' ? 'full' : 'rig'
        group.muted = false
      }
      selectedLayerId.value = group.kind === 'character' ? null : layer.id
      selectedGroupId.value = group.id
      editScope.value = group.kind === 'character' ? 'group' : 'layer'
      return layer
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
          (layer) => layer.groupId === group.id && layer.category === category && layer.assetId === assetId
        )
      : undefined
    const compatibleMode = group?.kind !== 'character' ||
      (group.activeMode === 'full') === (category === 'character_full')
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
          group.activeMode = category === 'character_full' ? 'full' : 'rig'
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
        transform: normalizeTransform(layer.transform)
      } as EditorLayer
      currentDocument.value.layers.push(created)
      return created
    })
  }

  function removeLayer(layerId: string): void {
    mutateStudio('Retirer un calque', () => {
      currentDocument.value.layers = currentDocument.value.layers.filter((layer) => layer.id !== layerId)
      if (selectedLayerId.value === layerId) selectedLayerId.value = null
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
          ? layer.category === 'character_full'
          : layer.category !== 'character_full')
      const removedCount = currentDocument.value.layers.filter(removesLayer).length
      currentDocument.value.layers = currentDocument.value.layers.filter((layer) => !removesLayer(layer))
      if (selectedGroupId.value === group.id) clearStudioSelection()
      return removedCount
    })
  }

  function updateLayer(layerId: string, changes: Partial<EditorLayer>, label = 'Modifier un calque'): void {
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

  function updateLayerSettings(layerId: string, transform: Partial<Transform2D>, zIndex: number): void {
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

  function createGroup(name: string, _customCategory?: string, color: EditorGroupColor = 'indigo'): EditorGroup {
    return mutateStudio('Créer un groupe', () => {
      const maxZ = currentDocument.value.groups.reduce((max, group) => Math.max(max, group.zIndex), 0)
      const group: EditorGroup = {
        id: generateId('grp'),
        name: name.trim() || 'Nouveau groupe',
        kind: 'stage',
        zIndex: maxZ + 5,
        transform: { ...DEFAULT_TRANSFORM },
        muted: false,
        locked: false,
        collapsed: false,
        color,
        allowedCategories: [],
        isDefault: false
      }
      currentDocument.value.groups.push(group)
      selectGroupForEditing(group.id)
      return group
    })
  }

  function updateGroup(groupId: string, changes: Partial<EditorGroup>, label = 'Modifier un groupe'): void {
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

  function updateGroupSettings(groupId: string, transform: Partial<Transform2D>, zIndex: number): void {
    mutateStudio('Régler un groupe', () => {
      const group = currentDocument.value.groups.find((candidate) => candidate.id === groupId)
      if (!group) return
      group.transform = mergeUniformTransform(group.transform, transform)
      group.zIndex = zIndex
    })
  }

  function updateGroupZIndex(groupId: string, zIndex: number): void {
    updateGroup(groupId, { zIndex }, 'Changer la profondeur d’un groupe')
  }

  function deleteGroup(groupId: string, deleteLayers = true): void {
    mutateStudio('Supprimer un groupe', () => {
      const fallback = currentDocument.value.groups.find((group) => group.id !== groupId && group.kind === 'stage')
      if (deleteLayers || !fallback) {
        currentDocument.value.layers = currentDocument.value.layers.filter((layer) => layer.groupId !== groupId)
      } else {
        for (const layer of currentDocument.value.layers) {
          if (layer.groupId === groupId) layer.groupId = fallback.id
        }
      }
      currentDocument.value.groups = currentDocument.value.groups.filter((group) => group.id !== groupId)
      if (selectedGroupId.value === groupId) clearStudioSelection()
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
    mutateStudio(activeMode === 'full' ? 'Afficher le personnage complet' : 'Afficher le rig', () => {
      const group = currentDocument.value.groups.find(
        (candidate): candidate is CharacterGroup => candidate.id === groupId && candidate.kind === 'character'
      )
      if (group) group.activeMode = activeMode
    })
  }

  function updateCamera(camera: CameraFrame): void {
    currentDocument.value.camera = { ...camera }
    persistInBackground()
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

  function selectGroupForEditing(groupId: string): void {
    if (!currentDocument.value.groups.some((group) => group.id === groupId)) return
    selectedGroupId.value = groupId
    selectedLayerId.value = null
    editScope.value = 'group'
  }

  function clearStudioSelection(): void {
    selectedLayerId.value = null
    selectedGroupId.value = null
  }

  function applyViewportSnapshot(snapshot: ViewportSnapshot): number {
    currentDocument.value.camera = clone(snapshot.camera)
    const normalized = normalizeDocument({
      ...currentDocument.value,
      groups: clone(snapshot.groups),
      layers: clone(snapshot.layers)
    })
    currentDocument.value.groups = normalized.groups
    currentDocument.value.layers = normalized.layers
    clearStudioSelection()
    clearHistory()
    persistInBackground()
    return currentDocument.value.layers.length
  }

  function syncAfterAssetDeletion(assetId: string): void {
    const affectedGroupIds = new Set(
      currentDocument.value.layers.filter((layer) => layer.assetId === assetId).map((layer) => layer.groupId)
    )
    currentDocument.value.layers = currentDocument.value.layers.filter((layer) => layer.assetId !== assetId)
    for (const groupId of affectedGroupIds) {
      const group = currentDocument.value.groups.find(
        (candidate): candidate is CharacterGroup => candidate.id === groupId && candidate.kind === 'character'
      )
      if (!group || group.activeMode !== 'full') continue
      const hasFull = currentDocument.value.layers.some(
        (layer) => layer.groupId === group.id && layer.category === 'character_full'
      )
      const hasRig = currentDocument.value.layers.some(
        (layer) => layer.groupId === group.id && layer.category !== 'character_full'
      )
      if (!hasFull && hasRig) group.activeMode = 'rig'
    }
    clearStudioSelection()
    clearHistory()
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
    toggleAssetInViewport,
    addLayer,
    removeLayer,
    removeActiveCharacterRepresentation,
    updateLayer,
    updateLayerTransform,
    updateLayerSettings,
    updateLayerZIndex,
    setLayerMuted,
    setLayerLocked,
    moveLayer,
    createGroup,
    updateGroup,
    updateGroupTransform,
    updateGroupSettings,
    updateGroupZIndex,
    deleteGroup,
    setGroupMuted,
    toggleGroupMuted,
    setGroupLocked,
    setGroupCollapsed,
    setCharacterMode,
    updateCamera,
    selectLayerForEditing,
    selectGroupForEditing,
    clearStudioSelection,
    beginGesture,
    endGesture,
    cancelGesture,
    undo,
    redo,
    clearHistory,
    applyViewportSnapshot,
    syncAfterAssetDeletion
  }
})
