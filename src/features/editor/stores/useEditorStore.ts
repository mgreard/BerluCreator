import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  CameraFrame,
  EditorDocument,
  EditorGroup,
  EditorGroupColor,
  EditorLayer,
  Transform2D,
  ViewportSnapshot
} from '@core/types/editor.types'
import { type AssetCategory } from '@core/types/asset.types'
import { DEFAULT_STAGE_RESOLUTION, DEFAULT_EDITOR_GROUPS } from '@core/constants/editor'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { editorDocumentRepository } from '@infrastructure/db/repositories/editor-document.repository'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { generateId } from '@/lib/utils'

export type TransformHistoryTarget =
  | { kind: 'group'; groupId: string }
  | { kind: 'layer'; layerId: string }

interface TransformHistoryEntry {
  kind: 'transform'
  target: TransformHistoryTarget
  before: Partial<Transform2D> | undefined
  after: Partial<Transform2D> | undefined
}

interface StructureHistoryEntry {
  kind: 'structure'
  documentBefore: EditorDocument
  documentAfter: EditorDocument
}

interface BatchHistoryEntry {
  kind: 'batch'
  entries: StudioHistoryEntry[]
}

type StudioHistoryEntry =
  | TransformHistoryEntry
  | StructureHistoryEntry
  | BatchHistoryEntry

interface TransformEditSession {
  target: TransformHistoryTarget
  before: Partial<Transform2D> | undefined
  gestureBefore?: Partial<Transform2D>
  gestureActive: boolean
  undo: StudioHistoryEntry[]
  redo: StudioHistoryEntry[]
}

const MAX_HISTORY = 50

function createDefaultDocument(projectId = 'proj_default'): EditorDocument {
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
    character: {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      visible: true,
      zIndex: 10
    },
    groups: JSON.parse(JSON.stringify(DEFAULT_EDITOR_GROUPS)),
    layers: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}

function cloneTransform(transform?: Partial<Transform2D>): Partial<Transform2D> | undefined {
  return transform ? { ...transform } : undefined
}

function transformsAreEqual(
  left?: Partial<Transform2D>,
  right?: Partial<Transform2D>
): boolean {
  if (!left && !right) return true
  if (!left || !right) return false
  return (
    (left.x ?? 0) === (right.x ?? 0) &&
    (left.y ?? 0) === (right.y ?? 0) &&
    (left.scaleX ?? 1) === (right.scaleX ?? 1) &&
    (left.scaleY ?? 1) === (right.scaleY ?? 1) &&
    (left.rotation ?? 0) === (right.rotation ?? 0) &&
    (left.opacity ?? 1) === (right.opacity ?? 1)
  )
}

function cloneDocument(doc: EditorDocument): EditorDocument {
  return JSON.parse(JSON.stringify(doc))
}

const SYSTEM_TAGS_SET = new Set([
  'arms', 'arms_left', 'arms_right', 'bras', 'left', 'right',
  'head', 'visage', 'expression', 'face',
  'mouth', 'bouche', 'phoneme', 'lips',
  'torso', 'corps', 'body', 'buste',
  'eyes', 'regard', 'lunettes', 'oeil', 'yeux',
  'props-host', 'props_host', 'presentateur', 'accessoire', 'apparel',
  'props-set', 'props_set', 'plateau', 'objet',
  'props-desk', 'props_desk', 'table',
  'background', 'fond', 'decor', 'arriere-plan',
  'desk', 'bureau',
  'foreground', 'premier-plan', 'ambiance',
  'tenue', 'outfit', 'costume', 'complet', 'full', 'all', 'sprite'
])

function isCustomCharacterTag(tag: string): boolean {
  const clean = tag.trim().toLowerCase()
  if (!clean) return false
  if (SYSTEM_TAGS_SET.has(clean)) return false
  if (clean.includes('_') || clean.includes('-')) return false
  return clean !== 'berlu'
}

function sanitizeDocumentGroups(doc: EditorDocument): void {
  const invalidGroupIds = new Set<string>()
  for (const g of doc.groups ?? []) {
    if (!g.isDefault && SYSTEM_TAGS_SET.has(g.name.toLowerCase().trim())) {
      invalidGroupIds.add(g.id)
    }
  }

  for (const layer of doc.layers) {
    const isChar = ASSET_CATEGORIES[layer.category]?.placementMode === 'character-anchored'
    if (isChar) {
      if (!layer.groupId || invalidGroupIds.has(layer.groupId)) {
        layer.groupId = 'grp_berlu'
      }
    }
  }

  if (invalidGroupIds.size > 0) {
    doc.groups = doc.groups.filter((g) => !invalidGroupIds.has(g.id))
  }
}

export const useEditorStore = defineStore('editor', () => {
  const currentDocument = ref<EditorDocument>(createDefaultDocument())
  const selectedLayerId = ref<string | null>(null)
  const selectedGroupId = ref<string | null>(null)
  const editScope = ref<'group' | 'layer'>('layer')

  const undoStack = ref<StudioHistoryEntry[]>([])
  const redoStack = ref<StudioHistoryEntry[]>([])
  const activeTransformSession = ref<TransformEditSession | null>(null)

  const isLoading = ref(false)
  const isSaving = ref(false)

  const selectedLayer = computed(() => {
    return currentDocument.value.layers.find((l) => l.id === selectedLayerId.value) ?? null
  })

  const selectedGroup = computed(() => {
    return currentDocument.value.groups?.find((g) => g.id === selectedGroupId.value) ?? null
  })

  const sortedLayers = computed(() => {
    return [...currentDocument.value.layers].sort((left, right) => {
      const isLeftChar = ASSET_CATEGORIES[left.category]?.placementMode === 'character-anchored'
      const isRightChar = ASSET_CATEGORIES[right.category]?.placementMode === 'character-anchored'
      const charZ = currentDocument.value.character?.zIndex ?? 10

      const leftZ = isLeftChar ? charZ * 100 + left.zIndex : left.zIndex
      const rightZ = isRightChar ? charZ * 100 + right.zIndex : right.zIndex

      if (leftZ !== rightZ) return leftZ - rightZ
      return (left.order ?? 0) - (right.order ?? 0)
    })
  })

  const hasActiveTransformSession = computed(() => activeTransformSession.value !== null)
  const canUndoTransform = computed(() =>
    activeTransformSession.value
      ? activeTransformSession.value.undo.length > 0
      : undoStack.value.length > 0
  )
  const canRedoTransform = computed(() =>
    activeTransformSession.value
      ? activeTransformSession.value.redo.length > 0
      : redoStack.value.length > 0
  )

  // ==================== CHARGEMENT ET SAUVEGARDE ====================

  async function loadDocument(documentId: string, projectId = 'proj_default'): Promise<EditorDocument> {
    isLoading.value = true
    try {
      const existing = await editorDocumentRepository.getById(documentId)
      if (existing) {
        if (!existing.character) {
          const berluGroup = existing.groups?.find((g) => g.id === 'grp_berlu')
          existing.character = {
            x: berluGroup?.transform?.x ?? 0,
            y: berluGroup?.transform?.y ?? 0,
            scaleX: berluGroup?.transform?.scaleX ?? 1,
            scaleY: berluGroup?.transform?.scaleY ?? 1,
            rotation: berluGroup?.transform?.rotation ?? 0,
            visible: !(berluGroup?.muted ?? false),
            zIndex: berluGroup?.zIndex ?? 10
          }
        }
        sanitizeDocumentGroups(existing)
        currentDocument.value = existing
      } else {
        const byProject = await editorDocumentRepository.getByProjectId(projectId)
        if (byProject.length > 0) {
          sanitizeDocumentGroups(byProject[0])
          currentDocument.value = byProject[0]
        } else {
          currentDocument.value = createDefaultDocument(projectId)
          currentDocument.value.id = documentId || 'doc_default'
          await editorDocumentRepository.save(currentDocument.value)
        }
      }
      clearStudioSelection(false)
      undoStack.value = []
      redoStack.value = []
      return currentDocument.value
    } finally {
      isLoading.value = false
    }
  }

  async function saveDocument(): Promise<void> {
    isSaving.value = true
    try {
      commitTransformSession(false)
      sanitizeDocumentGroups(currentDocument.value)
      await editorDocumentRepository.save(currentDocument.value)
    } finally {
      isSaving.value = false
    }
  }

  // ==================== GESTION DES CALQUES ====================

  function assignAssetToGroup(
    assetId: string,
    category: AssetCategory,
    targetGroupId?: string | null,
    name?: string
  ): EditorLayer | null {
    commitTransformSession(false)
    const categoryDef = ASSET_CATEGORIES[category]
    const cardinality = categoryDef?.layerCardinality ?? 'multi'

    const isCharacter = categoryDef?.placementMode === 'character-anchored'
    let foundAsset: any = undefined
    let calibration = undefined
    try {
      const assetStore = useAssetStore()
      foundAsset = assetStore.assets.find((a) => a.id === assetId)
      if (foundAsset?.calibration) {
        calibration = foundAsset.calibration
      }
    } catch {
      // Ignorer si appelé hors contexte Pinia actif
    }

    // 1. Si un groupe cible valide est spécifié par l'utilisateur (ex: groupe actif/sélectionné)
    let group = targetGroupId
      ? currentDocument.value.groups.find(
          (g) =>
            g.id === targetGroupId &&
            (g.allowedCategories.length === 0 || g.allowedCategories.includes(category))
        )
      : null

    // 2. Si c'est un élément de personnage et qu'aucun groupe spécifique n'est spécifié :
    if (!group && isCharacter) {
      // Rechercher un tag de personnage personnalisé sur l'asset (ex: "Pedro", "Invité"...)
      const charTag = foundAsset?.tags?.find((t: string) => isCustomCharacterTag(t))

      if (charTag) {
        const formattedName = charTag.charAt(0).toUpperCase() + charTag.slice(1)
        let charGroup = currentDocument.value.groups.find(
          (g) =>
            g.name.toLowerCase() === formattedName.toLowerCase() ||
            g.customCategory?.toLowerCase() === formattedName.toLowerCase()
        )

        // Si le groupe pour ce personnage n'existe pas encore sur le canvas, le créer automatiquement
        if (!charGroup) {
          const maxZ = currentDocument.value.groups.reduce((max, g) => Math.max(max, g.zIndex), 0)
          charGroup = {
            id: generateId('grp_char'),
            name: formattedName,
            zIndex: Math.max(20, maxZ + 1),
            color: 'indigo',
            allowedCategories: [
              'torso',
              'head',
              'mouth',
              'eyes',
              'arms_left',
              'arms_right',
              'props_host'
            ],
            isDefault: false
          }
          currentDocument.value.groups.push(charGroup)
        }
        group = charGroup
      } else {
        // Personnage par défaut : toutes les pièces de Berlu vont solidairement dans grp_berlu
        group = currentDocument.value.groups.find((g) => g.id === 'grp_berlu')
      }
    }

    // 3. Fallback : groupe par défaut autorisant cette catégorie
    if (!group) {
      group = currentDocument.value.groups.find(
        (g) => g.allowedCategories.includes(category)
      ) ?? currentDocument.value.groups.find(
        (g) => g.isDefault && g.allowedCategories.length === 0
      ) ?? currentDocument.value.groups[0]
    }

    if (!group) {
      // Création automatique de groupe de secours
      const newGroup: EditorGroup = {
        id: generateId('grp'),
        name: 'Groupe Principal',
        zIndex: categoryDef?.defaultZIndex ?? 0,
        allowedCategories: [category],
        isDefault: false
      }
      currentDocument.value.groups.push(newGroup)
      group = newGroup
    }

    // Gestion de la cardinalité (singleton ou catégorie de personnage) :
    // Un personnage ne peut avoir qu'un seul asset par catégorie à la fois sur le viewport.
    const isSingleSlot = cardinality === 'singleton' || isCharacter

    if (isSingleSlot) {
      const existingLayer = currentDocument.value.layers.find(
        (l) => l.category === category && l.groupId === group!.id
      ) ?? (isCharacter ? currentDocument.value.layers.find((l) => l.category === category) : undefined)

      if (existingLayer) {
        // Toggle OFF : Si cet asset est déjà sur le calque actif et visible, on le retire du viewport !
        if (existingLayer.assetId === assetId && !existingLayer.muted) {
          removeLayer(existingLayer.id)
          return null
        }

        // Sinon, on remplace l'asset du calque
        existingLayer.assetId = assetId
        existingLayer.name = name || existingLayer.name
        existingLayer.groupId = group!.id
        existingLayer.muted = false
        if (calibration) {
          existingLayer.transform = {
            x: calibration.x,
            y: calibration.y,
            scaleX: calibration.scaleX,
            scaleY: calibration.scaleY,
            rotation: calibration.rotation ?? 0
          }
          if (calibration.zIndex !== undefined) {
            existingLayer.zIndex = calibration.zIndex
          }
        }
        selectLayerForEditing(existingLayer.id)
        void saveDocument()
        return existingLayer
      }
    } else {
      // Pour les catégories multi (ex: décor plateau) : si l'asset exact existe déjà dans ce groupe, le retirer au clic (toggle off)
      const duplicateLayer = currentDocument.value.layers.find(
        (l) => l.assetId === assetId && l.groupId === group!.id && !l.muted
      )
      if (duplicateLayer) {
        removeLayer(duplicateLayer.id)
        return null
      }
    }

    // Sinon, créer un nouveau calque
    const maxOrder = currentDocument.value.layers
      .filter((l) => l.groupId === group!.id)
      .reduce((max, l) => Math.max(max, l.order ?? -1), -1)

    const newLayer: EditorLayer = {
      id: generateId('layer'),
      assetId,
      name: name || `Calque ${category}`,
      category,
      groupId: group.id,
      zIndex: calibration?.zIndex ?? categoryDef?.defaultZIndex ?? 0,
      order: maxOrder + 1,
      transform: calibration
        ? {
            x: calibration.x,
            y: calibration.y,
            scaleX: calibration.scaleX,
            scaleY: calibration.scaleY,
            rotation: calibration.rotation ?? 0
          }
        : undefined,
      muted: false,
      locked: false
    }

    currentDocument.value.layers.push(newLayer)
    selectLayerForEditing(newLayer.id)
    void saveDocument()
    return newLayer
  }

  function addLayer(layer: Omit<EditorLayer, 'id'> & { id?: string }): EditorLayer {
    const created: EditorLayer = {
      ...layer,
      id: layer.id || generateId('layer')
    }
    currentDocument.value.layers.push(created)
    void saveDocument()
    return created
  }

  function removeLayer(layerId: string): void {
    commitTransformSession(false)
    currentDocument.value.layers = currentDocument.value.layers.filter((l) => l.id !== layerId)
    if (selectedLayerId.value === layerId) {
      selectedLayerId.value = null
    }
    void saveDocument()
  }

  function updateLayer(layerId: string, changes: Partial<EditorLayer>): void {
    const layer = currentDocument.value.layers.find((l) => l.id === layerId)
    if (layer) {
      Object.assign(layer, changes)
      void saveDocument()
    }
  }

  function updateLayerTransform(layerId: string, transform: Partial<Transform2D>): void {
    const layer = currentDocument.value.layers.find((l) => l.id === layerId)
    if (layer) {
      layer.transform = {
        ...(layer.transform ?? {}),
        ...transform
      }
    }
  }

  function updateLayerZIndex(layerId: string, zIndex: number): void {
    updateLayer(layerId, { zIndex })
  }

  function updateLayerOrder(layerId: string, order: number): void {
    updateLayer(layerId, { order })
  }

  function setLayerMuted(layerId: string, muted: boolean): void {
    updateLayer(layerId, { muted })
  }

  function setLayerLocked(layerId: string, locked: boolean): void {
    updateLayer(layerId, { locked })
  }

  // ==================== GESTION DES GROUPES ====================

  function createGroup(
    name: string,
    customCategory?: string,
    color?: EditorGroupColor
  ): EditorGroup {
    const maxZ = currentDocument.value.groups.reduce((max, g) => Math.max(max, g.zIndex), 0)
    const newGroup: EditorGroup = {
      id: generateId('grp'),
      name: name.trim() || 'Nouveau Groupe',
      zIndex: maxZ + 5,
      color: color || 'indigo',
      allowedCategories: [],
      isDefault: false,
      customCategory: customCategory?.trim() || undefined
    }

    currentDocument.value.groups.push(newGroup)
    selectGroupForEditing(newGroup.id)
    void saveDocument()
    return newGroup
  }

  function updateGroup(groupId: string, changes: Partial<EditorGroup>): void {
    const group = currentDocument.value.groups.find((g) => g.id === groupId)
    if (group) {
      Object.assign(group, changes)
      void saveDocument()
    }
  }

  function updateGroupTransform(groupId: string, transform: Partial<Transform2D>): void {
    const group = currentDocument.value.groups.find((g) => g.id === groupId)
    if (group) {
      group.transform = {
        ...(group.transform ?? {}),
        ...transform
      }
    }
  }

  function updateGroupZIndex(groupId: string, zIndex: number): void {
    updateGroup(groupId, { zIndex })
  }

  function deleteGroup(groupId: string, deleteLayers = true): void {
    commitTransformSession(false)
    if (deleteLayers) {
      currentDocument.value.layers = currentDocument.value.layers.filter((l) => l.groupId !== groupId)
    } else {
      // Déplacer les calques orphelins vers le premier groupe restant
      const fallbackGroup = currentDocument.value.groups.find((g) => g.id !== groupId)
      if (fallbackGroup) {
        for (const layer of currentDocument.value.layers) {
          if (layer.groupId === groupId) layer.groupId = fallbackGroup.id
        }
      }
    }

    currentDocument.value.groups = currentDocument.value.groups.filter((g) => g.id !== groupId)
    if (selectedGroupId.value === groupId) {
      selectedGroupId.value = null
      selectedLayerId.value = null
    }
    void saveDocument()
  }

  function setGroupMuted(groupId: string, muted: boolean): void {
    updateGroup(groupId, { muted })
  }

  function toggleGroupMuted(groupId: string): void {
    const group = currentDocument.value.groups.find((g) => g.id === groupId)
    if (group) {
      updateGroup(groupId, { muted: !group.muted })
    }
  }

  function setGroupLocked(groupId: string, locked: boolean): void {
    updateGroup(groupId, { locked })
  }

  function setGroupCollapsed(groupId: string, collapsed: boolean): void {
    updateGroup(groupId, { collapsed })
  }

  // ==================== CAMÉRA ====================

  function updateCamera(camera: CameraFrame): void {
    currentDocument.value.camera = { ...camera }
    void saveDocument()
  }

  // ==================== SÉLECTION ====================

  function selectLayerForEditing(layerId: string): void {
    const layer = currentDocument.value.layers.find((l) => l.id === layerId)
    if (!layer) return

    selectedLayerId.value = layerId
    selectedGroupId.value = layer.groupId
    editScope.value = 'layer'
    startTransformSession({ kind: 'layer', layerId })
  }

  function selectGroupForEditing(groupId: string): void {
    const group = currentDocument.value.groups.find((g) => g.id === groupId)
    if (!group) return

    selectedGroupId.value = groupId
    selectedLayerId.value = null
    editScope.value = 'group'
    startTransformSession({ kind: 'group', groupId })
  }

  function clearStudioSelection(commitSession = true): void {
    if (commitSession) commitTransformSession(false)
    else cancelTransformSession()

    selectedLayerId.value = null
    selectedGroupId.value = null
  }

  // ==================== HISTORIQUE / UNDO-REDO ====================

  function getTransformForTarget(target: TransformHistoryTarget): Partial<Transform2D> | undefined {
    if (target.kind === 'group') {
      const group = currentDocument.value.groups.find((g) => g.id === target.groupId)
      return cloneTransform(group?.transform)
    }
    const layer = currentDocument.value.layers.find((l) => l.id === target.layerId)
    return cloneTransform(layer?.transform)
  }

  function applyTransformToTarget(
    target: TransformHistoryTarget,
    transform: Partial<Transform2D> | undefined
  ): boolean {
    const cloned = cloneTransform(transform)
    if (target.kind === 'group') {
      const group = currentDocument.value.groups.find((g) => g.id === target.groupId)
      if (!group) return false
      group.transform = cloned
      return true
    }
    const layer = currentDocument.value.layers.find((l) => l.id === target.layerId)
    if (!layer) return false
    layer.transform = cloned
    return true
  }

  function startTransformSession(target: TransformHistoryTarget): void {
    if (
      activeTransformSession.value &&
      activeTransformSession.value.target.kind === target.kind &&
      (target.kind === 'group'
        ? (activeTransformSession.value.target as { kind: 'group'; groupId: string }).groupId === target.groupId
        : (activeTransformSession.value.target as { kind: 'layer'; layerId: string }).layerId === target.layerId)
    ) {
      return
    }

    commitTransformSession(false)
    activeTransformSession.value = {
      target: { ...target },
      before: getTransformForTarget(target),
      gestureActive: false,
      undo: [],
      redo: []
    }
  }

  function beginTransformGesture(): void {
    const session = activeTransformSession.value
    if (!session) return
    session.gestureBefore = getTransformForTarget(session.target)
    session.gestureActive = true
  }

  function endTransformGesture(): void {
    const session = activeTransformSession.value
    if (!session || !session.gestureActive) return
    session.gestureActive = false

    const after = getTransformForTarget(session.target)
    if (transformsAreEqual(session.gestureBefore, after)) return

    session.undo.push({
      kind: 'transform',
      target: { ...session.target },
      before: session.gestureBefore,
      after
    })
    session.redo = []
    session.gestureBefore = undefined
  }

  function recordTransformAction(
    target: TransformHistoryTarget,
    before: Partial<Transform2D> | undefined,
    after: Partial<Transform2D> | undefined
  ): void {
    const beforeSnapshot = cloneTransform(before)
    const afterSnapshot = cloneTransform(after)
    if (transformsAreEqual(beforeSnapshot, afterSnapshot)) return

    undoStack.value.push({
      kind: 'transform',
      target: { ...target },
      before: beforeSnapshot,
      after: afterSnapshot
    })
    if (undoStack.value.length > MAX_HISTORY) undoStack.value.shift()
    redoStack.value = []
  }

  function applyHistoryEntry(
    entry: StudioHistoryEntry,
    direction: 'before' | 'after'
  ): boolean {
    if (entry.kind === 'transform') {
      return applyTransformToTarget(entry.target, entry[direction])
    }
    if (entry.kind === 'structure') {
      currentDocument.value = cloneDocument(
        direction === 'before' ? entry.documentBefore : entry.documentAfter
      )
      return true
    }
    if (entry.kind === 'batch') {
      const list = direction === 'before' ? [...entry.entries].reverse() : entry.entries
      let ok = true
      for (const item of list) {
        if (!applyHistoryEntry(item, direction)) ok = false
      }
      return ok
    }
    return false
  }

  function undoLastTransform(): void {
    const session = activeTransformSession.value
    if (session && session.undo.length > 0) {
      const entry = session.undo.pop()
      if (entry && applyHistoryEntry(entry, 'before')) {
        session.redo.push(entry)
      }
      return
    }

    const entry = undoStack.value.pop()
    if (entry && applyHistoryEntry(entry, 'before')) {
      redoStack.value.push(entry)
    }
  }

  function redoLastTransform(): void {
    const session = activeTransformSession.value
    if (session && session.redo.length > 0) {
      const entry = session.redo.pop()
      if (entry && applyHistoryEntry(entry, 'after')) {
        session.undo.push(entry)
      }
      return
    }

    const entry = redoStack.value.pop()
    if (entry && applyHistoryEntry(entry, 'after')) {
      undoStack.value.push(entry)
    }
  }

  function commitTransformSession(persist = true): void {
    const session = activeTransformSession.value
    if (!session) return

    if (session.undo.length > 0) {
      if (session.undo.length === 1) {
        undoStack.value.push(session.undo[0])
      } else {
        undoStack.value.push({
          kind: 'batch',
          entries: [...session.undo]
        })
      }
      if (undoStack.value.length > MAX_HISTORY) undoStack.value.shift()
      redoStack.value = []
    }

    activeTransformSession.value = null
    if (persist) void saveDocument()
  }

  function cancelTransformSession(): void {
    const session = activeTransformSession.value
    if (!session) return
    applyTransformToTarget(session.target, session.before)
    activeTransformSession.value = null
  }

  function updateCharacterTransform(transform: Partial<CharacterRigTransform>): void {
    currentDocument.value.character = {
      ...currentDocument.value.character,
      ...transform
    }
  }

  function setCharacterVisibility(visible: boolean): void {
    currentDocument.value.character.visible = visible
  }

  function toggleCharacterMuted(): void {
    currentDocument.value.character.visible = !currentDocument.value.character.visible
  }

  // ==================== APPLICATION DE VIEWPORT SNAPSHOT ====================

  function applyViewportSnapshot(snapshot: ViewportSnapshot): number {
    commitTransformSession(false)

    // Remplacement atomique de la scène
    currentDocument.value.camera = { ...snapshot.camera }
    currentDocument.value.character = {
      ...(snapshot.character || {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        visible: true,
        zIndex: 10
      })
    }
    currentDocument.value.groups = JSON.parse(JSON.stringify(snapshot.groups || []))
    currentDocument.value.layers = JSON.parse(JSON.stringify(snapshot.layers))

    clearStudioSelection(false)
    undoStack.value = []
    redoStack.value = []

    void saveDocument()
    return currentDocument.value.layers.length
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
    sortedLayers,
    hasActiveTransformSession,
    canUndoTransform,
    canRedoTransform,
    loadDocument,
    saveDocument,
    assignAssetToGroup,
    addLayer,
    removeLayer,
    updateLayer,
    updateLayerTransform,
    updateLayerZIndex,
    updateLayerOrder,
    setLayerMuted,
    setLayerLocked,
    createGroup,
    updateGroup,
    updateGroupTransform,
    updateGroupZIndex,
    deleteGroup,
    setGroupMuted,
    toggleGroupMuted,
    setGroupLocked,
    setGroupCollapsed,
    updateCharacterTransform,
    setCharacterVisibility,
    toggleCharacterMuted,
    updateCamera,
    selectLayerForEditing,
    selectGroupForEditing,
    clearStudioSelection,
    beginTransformGesture,
    endTransformGesture,
    recordTransformAction,
    undoLastTransform,
    redoLastTransform,
    commitTransformSession,
    cancelTransformSession,
    applyViewportSnapshot
  }
})
