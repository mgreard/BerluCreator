import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Sequence,
  TimelineTrack,
  TrackGroup,
  TrackGroupColor,
  Keyframe,
  KeyframeSprite,
  SequenceNavigationState,
  SequenceStep,
  StepGroupState,
  Transform2D,
  SavedKeyframePreset,
  SavedKeyframeSprite,
  CameraFrame
} from '@core/types/timeline.types'
import { normalizeAssetCategory, type AssetCategory } from '@core/types/asset.types'
import {
  DEFAULT_STAGE_RESOLUTION,
  DEFAULT_TRACK_SLOTS,
  DEFAULT_TRACK_GROUPS
} from '@core/constants/timeline'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { sequenceRepository } from '@infrastructure/db/repositories/sequence.repository'
import { generateId } from '@/lib/utils'

export type TransformHistoryTarget =
  | { kind: 'group'; groupId: string }
  | { kind: 'keyframe-sprite'; trackId: string; keyframeId: string; spriteId: string }

interface TransformHistoryEntry {
  kind: 'transform'
  target: TransformHistoryTarget
  before: Partial<Transform2D> | undefined
  after: Partial<Transform2D> | undefined
}

interface TrackKeyframesHistoryEntry {
  kind: 'track-keyframes'
  trackId: string
  before: Keyframe[]
  after: Keyframe[]
}

interface BatchHistoryEntry {
  kind: 'batch'
  entries: StudioHistoryEntry[]
}

type StudioHistoryEntry = TransformHistoryEntry | TrackKeyframesHistoryEntry | BatchHistoryEntry

interface TransformEditSession {
  target: TransformHistoryTarget
  before: Partial<Transform2D> | undefined
  gestureBefore?: Partial<Transform2D>
  gestureActive: boolean
  undo: StudioHistoryEntry[]
  redo: StudioHistoryEntry[]
}

const MAX_TRANSFORM_HISTORY = 50

export const useTimelineStore = defineStore('timeline', () => {
  const initialStep = createInitialStep()
  const currentSequence = ref<Sequence>({
    id: 'seq_default',
    projectId: 'proj_default',
    name: 'Séquence Principale',
    steps: [initialStep],
    groups: createDefaultGroups(),
    tracks: createDefaultTracks(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  })
  ensureAutonomousSnapshots(currentSequence.value)

  const navigation = ref<SequenceNavigationState>({
    activeStepId: initialStep.id
  })

  const selectedTrackId = ref<string | null>(null)
  const selectedGroupId = ref<string | null>(null)
  const selectedKeyframeId = ref<string | null>(null)
  const selectedSpriteId = ref<string | null>(null)
  const editScope = ref<'group' | 'layer'>('layer')
  const undoTransformStack = ref<StudioHistoryEntry[]>([])
  const redoTransformStack = ref<StudioHistoryEntry[]>([])
  const activeTransformSession = ref<TransformEditSession | null>(null)

  const orderedSteps = computed(() =>
    [...currentSequence.value.steps].sort((left, right) => left.order - right.order)
  )
  const activeStep = computed(() =>
    orderedSteps.value.find((step) => step.id === navigation.value.activeStepId)
      ?? orderedSteps.value[0]
      ?? null
  )
  const activeStepIndex = computed(() =>
    Math.max(0, orderedSteps.value.findIndex((step) => step.id === activeStep.value?.id))
  )

  const selectedTrack = computed(() => {
    return currentSequence.value.tracks.find((t) => t.id === selectedTrackId.value) ?? null
  })

  const selectedGroup = computed(() => {
    return currentSequence.value.groups?.find((g) => g.id === selectedGroupId.value) ?? null
  })

  const hasActiveTransformSession = computed(() => activeTransformSession.value !== null)
  const canUndoTransform = computed(() =>
    activeTransformSession.value
      ? activeTransformSession.value.undo.length > 0
      : undoTransformStack.value.length > 0
  )
  const canRedoTransform = computed(() =>
    activeTransformSession.value
      ? activeTransformSession.value.redo.length > 0
      : redoTransformStack.value.length > 0
  )

  function recordTransformAction(
    target: TransformHistoryTarget,
    before: Partial<Transform2D> | undefined,
    after: Partial<Transform2D> | undefined
  ) {
    const beforeSnapshot = cloneTransform(before)
    const afterSnapshot = cloneTransform(after)
    if (transformsAreEqual(beforeSnapshot, afterSnapshot)) return

    undoTransformStack.value.push({
      kind: 'transform',
      target: { ...target },
      before: beforeSnapshot,
      after: afterSnapshot
    })
    if (undoTransformStack.value.length > MAX_TRANSFORM_HISTORY) {
      undoTransformStack.value.shift()
    }
    redoTransformStack.value = []
  }

  function undoLastTransform() {
    const session = activeTransformSession.value
    if (session) {
      const entry = session.undo.pop()
      if (!entry) return
      if (applyStudioHistoryEntry(entry, 'before', false)) session.redo.push(entry)
      return
    }
    const entry = undoTransformStack.value.pop()
    if (!entry) return

    if (applyStudioHistoryEntry(entry, 'before', true)) {
      redoTransformStack.value.push(entry)
    }
  }

  function redoLastTransform() {
    const session = activeTransformSession.value
    if (session) {
      const entry = session.redo.pop()
      if (!entry) return
      if (applyStudioHistoryEntry(entry, 'after', false)) session.undo.push(entry)
      return
    }
    const entry = redoTransformStack.value.pop()
    if (!entry) return

    if (applyStudioHistoryEntry(entry, 'after', true)) {
      undoTransformStack.value.push(entry)
    }
  }

  function clearTransformHistory() {
    undoTransformStack.value = []
    redoTransformStack.value = []
    activeTransformSession.value = null
  }

  function readTransformSnapshot(
    target: TransformHistoryTarget
  ): Partial<Transform2D> | undefined {
    if (target.kind === 'group') {
      const group = currentSequence.value.groups?.find(
        (candidate) => candidate.id === target.groupId
      )
      return cloneTransform(group?.transform)
    }

    const track = currentSequence.value.tracks.find(
      (candidate) => candidate.id === target.trackId
    )
    const keyframe = track?.keyframes.find(
      (candidate) => candidate.id === target.keyframeId
    )
    const sprite = keyframe?.sprites.find(
      (candidate) => candidate.id === target.spriteId
    )
    return cloneTransform(sprite?.transform)
  }

  function beginTransformSession(target: TransformHistoryTarget) {
    const activeSession = activeTransformSession.value
    if (activeSession && transformTargetsAreEqual(activeSession.target, target)) return
    if (activeSession) commitTransformSession(false)

    activeTransformSession.value = {
      target: { ...target },
      before: readTransformSnapshot(target),
      gestureActive: false,
      undo: [],
      redo: []
    }
  }

  function beginTransformGesture() {
    const session = activeTransformSession.value
    if (!session || session.gestureActive) return
    session.gestureBefore = readTransformSnapshot(session.target)
    session.gestureActive = true
  }

  function commitTransformGesture() {
    const session = activeTransformSession.value
    if (!session || !session.gestureActive) return
    const after = readTransformSnapshot(session.target)
    if (!transformsAreEqual(session.gestureBefore, after)) {
      session.undo.push({
        kind: 'transform',
        target: { ...session.target },
        before: cloneTransform(session.gestureBefore),
        after: cloneTransform(after)
      })
      session.redo = []
    }
    session.gestureBefore = undefined
    session.gestureActive = false
  }

  function commitTransformSession(clearSelection = true) {
    const session = activeTransformSession.value
    if (!session) {
      if (clearSelection) clearStudioSelection(false)
      return
    }

    commitTransformGesture()
    if (session.undo.length > 0) {
      undoTransformStack.value.push({ kind: 'batch', entries: [...session.undo] })
      if (undoTransformStack.value.length > MAX_TRANSFORM_HISTORY) undoTransformStack.value.shift()
      redoTransformStack.value = []
    } else {
      recordTransformAction(session.target, session.before, readTransformSnapshot(session.target))
    }
    activeTransformSession.value = null
    saveSequence()
    if (clearSelection) clearStudioSelection(false)
  }

  function cancelTransformSession(clearSelection = true) {
    const session = activeTransformSession.value
    if (session) {
      for (const entry of [...session.undo].reverse()) applyStudioHistoryEntry(entry, 'before', false)
      applyTransformSnapshot(session.target, session.before, false)
      activeTransformSession.value = null
    }
    if (clearSelection) clearStudioSelection(false)
  }

  function applyTransformSnapshot(
    target: TransformHistoryTarget,
    snapshot: Partial<Transform2D> | undefined,
    persist = false
  ): boolean {
    if (target.kind === 'group') {
      const group = currentSequence.value.groups?.find((candidate) => candidate.id === target.groupId)
      if (!group) return false
      group.transform = cloneTransform(snapshot)
      const state = activeStep.value && getGroupStateAtStep(group.id, activeStep.value.id)
      if (state) state.transform = cloneTransform(snapshot)
    } else {
      const track = currentSequence.value.tracks.find(
        (candidate) => candidate.id === target.trackId
      )
      const keyframe = track?.keyframes.find(
        (candidate) => candidate.id === target.keyframeId
      )
      const sprite = keyframe?.sprites.find(
        (candidate) => candidate.id === target.spriteId
      )
      if (!sprite) return false
      sprite.transform = cloneTransform(snapshot)
    }

    if (persist) saveSequence()
    return true
  }

  function applyStudioHistoryEntry(
    entry: StudioHistoryEntry,
    direction: 'before' | 'after',
    persist: boolean
  ): boolean {
    if (entry.kind === 'transform') {
      return applyTransformSnapshot(entry.target, entry[direction], persist)
    }
    if (entry.kind === 'track-keyframes') {
      const track = currentSequence.value.tracks.find((candidate) => candidate.id === entry.trackId)
      if (!track) return false
      track.keyframes = cloneKeyframes(entry[direction])
      if (persist) saveSequence()
      return true
    }
    const entries = direction === 'before' ? [...entry.entries].reverse() : entry.entries
    let applied = false
    for (const child of entries) applied = applyStudioHistoryEntry(child, direction, false) || applied
    if (applied && persist) saveSequence()
    return applied
  }

  function selectTrackForEditing(trackId: string) {
    const track = currentSequence.value.tracks.find((candidate) => candidate.id === trackId)
    if (!track) return

    const activeTarget = activeTransformSession.value?.target
    if (
      activeTarget &&
      (activeTarget.kind === 'group' || activeTarget.trackId !== trackId)
    ) {
      commitTransformSession(false)
    }

    selectedTrackId.value = track.id
    selectedGroupId.value = track.groupId ?? null
    editScope.value = 'layer'
    if (track.groupId) setGroupCollapsed(track.groupId, false)

    if (
      selectedKeyframeId.value &&
      !track.keyframes.some((keyframe) => keyframe.id === selectedKeyframeId.value)
    ) {
      selectedKeyframeId.value = null
      selectedSpriteId.value = null
    } else if (selectedKeyframeId.value) {
      const keyframe = track.keyframes.find(
        (candidate) => candidate.id === selectedKeyframeId.value
      )
      if (!keyframe?.sprites.some((sprite) => sprite.id === selectedSpriteId.value)) {
        selectedSpriteId.value = keyframe?.sprites[0]?.id ?? null
      }
    }
  }

  function selectKeyframeForEditing(trackId: string, keyframeId: string) {
    const track = currentSequence.value.tracks.find((candidate) => candidate.id === trackId)
    const keyframe = track?.keyframes.find((candidate) => candidate.id === keyframeId)
    if (!track || !keyframe) return

    const firstSprite = [...keyframe.sprites].sort((left, right) => left.order - right.order)[0]
    if (firstSprite) {
      selectSpriteForEditing(track.id, keyframe.id, firstSprite.id)
    } else {
      selectTrackForEditing(track.id)
      selectedKeyframeId.value = keyframe.id
      selectedSpriteId.value = null
    }
  }

  function selectSpriteForEditing(trackId: string, keyframeId: string, spriteId: string) {
    const track = currentSequence.value.tracks.find((candidate) => candidate.id === trackId)
    const keyframe = track?.keyframes.find((candidate) => candidate.id === keyframeId)
    const sprite = keyframe?.sprites.find((candidate) => candidate.id === spriteId)
    if (!track || !keyframe || !sprite) return

    const editable = materializeSpriteAtActiveStep(trackId, keyframeId, spriteId)
    if (!editable) return

    selectedTrackId.value = track.id
    selectedGroupId.value = track.groupId ?? null
    selectedKeyframeId.value = editable.keyframe.id
    selectedSpriteId.value = editable.sprite.id
    editScope.value = 'layer'
    if (track.groupId) setGroupCollapsed(track.groupId, false)
    beginTransformSession({
      kind: 'keyframe-sprite',
      trackId: track.id,
      keyframeId: editable.keyframe.id,
      spriteId: editable.sprite.id
    })
  }

  function selectGroupForEditing(groupId: string) {
    const group = currentSequence.value.groups?.find((candidate) => candidate.id === groupId)
    if (!group) return

    const selectedTrackBelongsToGroup = currentSequence.value.tracks.some(
      (track) => track.id === selectedTrackId.value && track.groupId === groupId
    )
    if (!selectedTrackBelongsToGroup) {
      selectedTrackId.value =
        currentSequence.value.tracks.find((track) => track.groupId === groupId)?.id ?? null
    }

    selectedGroupId.value = group.id
    selectedKeyframeId.value = null
    selectedSpriteId.value = null
    editScope.value = 'group'
    setGroupCollapsed(group.id, false)
    beginTransformSession({ kind: 'group', groupId: group.id })
  }

  function clearStudioSelection(commitActiveSession = true) {
    if (commitActiveSession && activeTransformSession.value) {
      commitTransformSession(false)
    }
    selectedTrackId.value = null
    selectedGroupId.value = null
    selectedKeyframeId.value = null
    selectedSpriteId.value = null
    editScope.value = 'layer'
  }

  function captureSelectionAnchor() {
    const track = currentSequence.value.tracks.find(
      (candidate) => candidate.id === selectedTrackId.value
    )
    const keyframe = track?.keyframes.find(
      (candidate) => candidate.id === selectedKeyframeId.value
    )
    const sprite = keyframe?.sprites.find(
      (candidate) => candidate.id === selectedSpriteId.value
    )
    return {
      scope: editScope.value,
      groupId: selectedGroupId.value,
      trackId: track?.id ?? null,
      assetId: sprite?.assetId ?? null,
      order: sprite?.order ?? null
    }
  }

  function restoreSelectionAnchor(
    anchor: ReturnType<typeof captureSelectionAnchor>,
    stepId: string
  ) {
    if (anchor.scope === 'group' && anchor.groupId) {
      selectGroupForEditing(anchor.groupId)
      return
    }
    if (!anchor.trackId) {
      clearStudioSelection(false)
      return
    }
    const keyframe = getKeyframeAtStep(anchor.trackId, stepId)
    const sprite = keyframe?.sprites.find(
      (candidate) => candidate.assetId === anchor.assetId && candidate.order === anchor.order
    )
    if (keyframe && sprite) {
      selectSpriteForEditing(anchor.trackId, keyframe.id, sprite.id)
    } else {
      selectTrackForEditing(anchor.trackId)
      selectedKeyframeId.value = keyframe?.id ?? null
      selectedSpriteId.value = null
    }
  }

  function getGroupStateAtStep(groupId: string, stepId: string): StepGroupState | null {
    return currentSequence.value.steps
      .find((step) => step.id === stepId)
      ?.groupStates.find((state) => state.groupId === groupId) ?? null
  }

  function activateSnapshot(stepId: string) {
    const step = currentSequence.value.steps.find((candidate) => candidate.id === stepId)
    if (!step) return
    for (const group of currentSequence.value.groups ?? []) {
      const state = step.groupStates.find((candidate) => candidate.groupId === group.id)
      if (!state) continue
      group.zIndex = state.zIndex
      group.transform = cloneTransform(state.transform)
      group.muted = state.muted
      group.locked = state.locked
    }
    for (const track of currentSequence.value.tracks) {
      const state = getKeyframeAtStep(track.id, stepId)
      if (!state) continue
      track.zIndex = state.zIndex
      track.muted = state.muted
      track.locked = state.locked
    }
  }

  /**
   * Initialise ou charge la séquence depuis Dexie
   */
  async function loadSequence(sequenceId: string, projectId: string) {
    clearTransformHistory()
    const seq = await sequenceRepository.getById(sequenceId)
    if (seq) {
      const wasMigrated = migrateSequenceStructure(seq)
      currentSequence.value = seq
      navigation.value.activeStepId = seq.steps[0]?.id ?? createInitialStep().id
      activateSnapshot(navigation.value.activeStepId)
      if (wasMigrated) await sequenceRepository.save(seq)
    } else {
      currentSequence.value.id = sequenceId
      currentSequence.value.projectId = projectId
      await sequenceRepository.save(currentSequence.value)
    }
  }

  // =========================================================================
  // Navigation par étapes discrètes
  // =========================================================================

  function normalizeStepOrders() {
    orderedSteps.value.forEach((step, index) => {
      step.order = index
      step.label = `Étape ${String(index + 1).padStart(2, '0')}`
    })
  }

  function selectStep(stepId: string) {
    if (!currentSequence.value.steps.some((step) => step.id === stepId)) return
    const selection = captureSelectionAnchor()
    if (activeTransformSession.value) commitTransformSession(false)
    navigation.value.activeStepId = stepId
    activateSnapshot(stepId)
    restoreSelectionAnchor(selection, stepId)
  }

  function addStepAfter(afterStepId = activeStep.value?.id): SequenceStep {
    const steps = orderedSteps.value
    const afterIndex = Math.max(0, steps.findIndex((step) => step.id === afterStepId))
    const sourceStep = steps[afterIndex] ?? steps[0]
    const selection = captureSelectionAnchor()
    const step: SequenceStep = {
      id: generateId('step'),
      label: '',
      order: afterIndex + 1,
      groupStates: cloneGroupStates(sourceStep?.groupStates ?? []),
      camera: cloneCameraFrame(sourceStep?.camera)
    }
    for (const candidate of steps.slice(afterIndex + 1)) candidate.order += 1
    currentSequence.value.steps.push(step)
    for (const track of currentSequence.value.tracks) {
      const source = sourceStep ? getKeyframeAtStep(track.id, sourceStep.id) : null
      const snapshot = createTrackSnapshot(track, step.id, source?.sprites ?? [])
      if (source) {
        snapshot.zIndex = source.zIndex
        snapshot.muted = source.muted
        snapshot.locked = source.locked
      }
      track.keyframes.push(snapshot)
    }
    normalizeStepOrders()
    navigation.value.activeStepId = step.id
    activateSnapshot(step.id)
    restoreSelectionAnchor(selection, step.id)
    saveSequence()
    return step
  }

  function duplicateStep(stepId = activeStep.value?.id): SequenceStep | null {
    if (!stepId) return null
    const sourceStep = currentSequence.value.steps.find((step) => step.id === stepId)
    if (!sourceStep) return null
    return addStepAfter(stepId)
  }

  function moveStep(stepId: string, targetIndex: number) {
    const steps = orderedSteps.value
    const sourceIndex = steps.findIndex((step) => step.id === stepId)
    if (sourceIndex < 0) return
    const [step] = steps.splice(sourceIndex, 1)
    if (!step) return
    steps.splice(Math.max(0, Math.min(targetIndex, steps.length)), 0, step)
    steps.forEach((candidate, index) => {
      candidate.order = index
      candidate.label = `Étape ${String(index + 1).padStart(2, '0')}`
    })
    saveSequence()
  }

  function removeStep(stepId: string) {
    if (currentSequence.value.steps.length <= 1) return
    const selection = captureSelectionAnchor()
    const steps = orderedSteps.value
    const removedIndex = steps.findIndex((step) => step.id === stepId)
    if (removedIndex < 0) return
    currentSequence.value.steps = currentSequence.value.steps.filter((step) => step.id !== stepId)
    for (const track of currentSequence.value.tracks) {
      track.keyframes = track.keyframes.filter((keyframe) => keyframe.stepId !== stepId)
    }
    normalizeStepOrders()
    const next = orderedSteps.value[Math.min(removedIndex, orderedSteps.value.length - 1)]
    if (next) navigation.value.activeStepId = next.id
    activateSnapshot(navigation.value.activeStepId)
    restoreSelectionAnchor(selection, navigation.value.activeStepId)
    clearTransformHistory()
    saveSequence()
  }

  function updateActiveStepCamera(camera: CameraFrame, persist = false) {
    if (!activeStep.value) return
    activeStep.value.camera = cloneCameraFrame(camera)
    if (persist) saveSequence()
  }

  // =========================================================================
  // Gestion des Groupes de Pistes
  // =========================================================================

  function addGroup(
    name: string,
    zIndex?: number,
    color?: TrackGroupColor,
    allowedCategories: AssetCategory[] = []
  ): TrackGroup {
    if (!currentSequence.value.groups) {
      currentSequence.value.groups = []
    }

    const normalizedName = name.trim() || 'Nouveau Groupe'
    const existing = findCustomGroupByCategory(normalizedName)
    if (existing) {
      selectGroupForEditing(existing.id)
      return existing
    }

    const defaultZ = zIndex ?? (currentSequence.value.groups.length > 0
      ? Math.max(...currentSequence.value.groups.map((g) => g.zIndex)) + 10
      : 20)

    const newGroup: TrackGroup = {
      id: generateId('grp'),
      name: normalizedName,
      zIndex: defaultZ,
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
      muted: false,
      locked: false,
      collapsed: false,
      color: color || 'indigo',
      allowedCategories: [...new Set(allowedCategories)],
      isDefault: false,
      customCategory: normalizedName
    }

    currentSequence.value.groups.push(newGroup)
    for (const step of currentSequence.value.steps) {
      step.groupStates.push(createGroupSnapshot(newGroup))
    }
    selectGroupForEditing(newGroup.id)
    saveSequence()
    return newGroup
  }

  function removeGroup(groupId: string, deleteTracks: boolean = false) {
    if (!currentSequence.value.groups) return

    if (deleteTracks) {
      currentSequence.value.tracks = currentSequence.value.tracks.filter((t) => t.groupId !== groupId)
    } else {
      for (const track of currentSequence.value.tracks) {
        if (track.groupId === groupId) {
          track.groupId = resolveDefaultGroupId(track.category, groupId)
        }
      }
    }

    currentSequence.value.groups = currentSequence.value.groups.filter((g) => g.id !== groupId)
    for (const step of currentSequence.value.steps) {
      step.groupStates = step.groupStates.filter((state) => state.groupId !== groupId)
    }
    if (selectedGroupId.value === groupId) {
      const currentTrackId = selectedTrackId.value
      if (currentTrackId && currentSequence.value.tracks.some((track) => track.id === currentTrackId)) {
        selectTrackForEditing(currentTrackId)
      } else {
        clearStudioSelection()
      }
    }
    saveSequence()
  }

  function updateGroup(groupId: string, partial: Partial<TrackGroup>) {
    if (!currentSequence.value.groups) return
    const group = currentSequence.value.groups.find((g) => g.id === groupId)
    if (group) {
      Object.assign(group, partial)
      const state = activeStep.value && getGroupStateAtStep(groupId, activeStep.value.id)
      if (state) {
        if (partial.zIndex !== undefined) state.zIndex = partial.zIndex
        if (partial.transform !== undefined) state.transform = cloneTransform(partial.transform)
        if (partial.muted !== undefined) state.muted = partial.muted
        if (partial.locked !== undefined) state.locked = partial.locked
      }
      saveSequence()
    }
  }

  function updateGroupTransform(groupId: string, transform: Partial<Transform2D>) {
    if (!currentSequence.value.groups) return
    const group = currentSequence.value.groups.find((g) => g.id === groupId)
    if (group) {
      group.transform = {
        ...group.transform,
        ...transform
      }
      const state = activeStep.value && getGroupStateAtStep(groupId, activeStep.value.id)
      if (state) state.transform = cloneTransform(group.transform)
      saveSequence()
    }
  }

  function updateGroupZIndex(groupId: string, zIndex: number) {
    if (!currentSequence.value.groups) return
    const group = currentSequence.value.groups.find((g) => g.id === groupId)
    if (group) {
      group.zIndex = zIndex
      const state = activeStep.value && getGroupStateAtStep(groupId, activeStep.value.id)
      if (state) state.zIndex = zIndex
      saveSequence()
    }
  }

  function toggleGroupCollapse(groupId: string) {
    const group = currentSequence.value.groups?.find((candidate) => candidate.id === groupId)
    if (group) setGroupCollapsed(groupId, !group.collapsed)
  }

  function setGroupCollapsed(groupId: string, collapsed: boolean) {
    if (!currentSequence.value.groups) return
    const group = currentSequence.value.groups.find((g) => g.id === groupId)
    if (group) {
      group.collapsed = collapsed
    }
  }

  function toggleGroupMute(groupId: string) {
    if (!currentSequence.value.groups) return
    const group = currentSequence.value.groups.find((g) => g.id === groupId)
    if (group) {
      group.muted = !group.muted
      const state = activeStep.value && getGroupStateAtStep(groupId, activeStep.value.id)
      if (state) state.muted = Boolean(group.muted)
      saveSequence()
    }
  }

  function toggleGroupLock(groupId: string) {
    if (!currentSequence.value.groups) return
    const group = currentSequence.value.groups.find((g) => g.id === groupId)
    if (group) {
      group.locked = !group.locked
      const state = activeStep.value && getGroupStateAtStep(groupId, activeStep.value.id)
      if (state) state.locked = Boolean(group.locked)
      saveSequence()
    }
  }

  function setTrackGroup(trackId: string, groupId: string | null) {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (track) {
      const targetGroupId = groupId && currentSequence.value.groups?.some((group) => group.id === groupId)
        ? groupId
        : resolveDefaultGroupId(track.category)
      track.groupId = targetGroupId
      const group = currentSequence.value.groups?.find((candidate) => candidate.id === targetGroupId)
      if (group && !group.allowedCategories.includes(track.category)) group.allowedCategories.push(track.category)
      saveSequence()
    }
  }

  function resolveDefaultGroupId(category: AssetCategory, excludedGroupId?: string): string {
    const groups = currentSequence.value.groups ?? []
    return groups.find(
      (group) => group.id !== excludedGroupId && group.isDefault && group.allowedCategories.includes(category)
    )?.id ?? groups.find((group) => group.id !== excludedGroupId)?.id ?? addGroup(
      ASSET_CATEGORIES[category].label,
      ASSET_CATEGORIES[category].defaultZIndex,
      'indigo',
      [category]
    ).id
  }

  function findCustomGroupByCategory(customCategory: string): TrackGroup | null {
    const key = normalizeRoutingCategory(customCategory)
    if (!key) return null
    return currentSequence.value.groups?.find(
      (group) => !group.isDefault && normalizeRoutingCategory(group.customCategory ?? group.name) === key
    ) ?? null
  }

  function ensureCustomGroup(
    customCategory: string,
    assetCategory: AssetCategory
  ): TrackGroup {
    const name = customCategory.trim()
    const existing = findCustomGroupByCategory(name)
    if (existing) {
      if (!existing.allowedCategories.includes(assetCategory)) {
        existing.allowedCategories.push(assetCategory)
        saveSequence()
      }
      return existing
    }
    return addGroup(name, undefined, 'indigo', [assetCategory])
  }

  // =========================================================================
  // Gestion des Pistes & Keyframes
  // =========================================================================

  function addTrack(category: AssetCategory, name?: string, zIndex?: number, groupId?: string): TimelineTrack {
    const catDef = ASSET_CATEGORIES[category]
    const existingSameCat = currentSequence.value.tracks.filter((t) => t.category === category)
    const trackIndex = existingSameCat.length + 1

    const trackName = name || (existingSameCat.length > 0 ? `${catDef?.label || category} ${trackIndex}` : catDef?.label || category)
    const trackZIndex = zIndex ?? ((catDef?.defaultZIndex ?? 30) + existingSameCat.length)

    const targetGroupId = groupId && currentSequence.value.groups?.some((group) => group.id === groupId)
      ? groupId
      : resolveDefaultGroupId(category)

    const newTrack: TimelineTrack = {
      id: generateId(`trk_${category}`),
      name: trackName,
      category,
      targetSlot: category,
      groupId: targetGroupId,
      zIndex: trackZIndex,
      muted: false,
      locked: false,
      keyframes: []
    }

    const targetGroup = currentSequence.value.groups?.find((group) => group.id === targetGroupId)
    if (targetGroup && !targetGroup.allowedCategories.includes(category)) targetGroup.allowedCategories.push(category)
    for (const step of currentSequence.value.steps) {
      newTrack.keyframes.push(createTrackSnapshot(newTrack, step.id))
    }
    currentSequence.value.tracks.push(newTrack)
    selectTrackForEditing(newTrack.id)
    saveSequence()
    return newTrack
  }

  function removeTrack(trackId: string) {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (!track) return

    // Les singletons fondamentaux de base ne doivent pas être supprimés si c'est la seule piste
    const catDef = ASSET_CATEGORIES[track.category]
    if (catDef && catDef.trackCardinality === 'singleton') {
      const sameCatCount = currentSequence.value.tracks.filter((t) => t.category === track.category).length
      if (sameCatCount <= 1) return
    }

    currentSequence.value.tracks = currentSequence.value.tracks.filter((t) => t.id !== trackId)
    if (selectedTrackId.value === trackId) {
      const nextTrackId = currentSequence.value.tracks[0]?.id
      if (nextTrackId) {
        selectTrackForEditing(nextTrackId)
      } else {
        clearStudioSelection()
      }
    }
    saveSequence()
  }

  function updateTrackZIndex(trackId: string, zIndex: number) {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (track) {
      track.zIndex = zIndex
      const keyframe = activeStep.value && getKeyframeAtStep(trackId, activeStep.value.id)
      if (keyframe) keyframe.zIndex = zIndex
      saveSequence()
    }
  }

  function addKeyframe(
    trackId: string,
    stepId: string,
    assetId: string | null,
    label?: string,
    transform?: Partial<Transform2D>
  ): KeyframeSprite | null {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (!track) return null

    if (!currentSequence.value.steps.some((step) => step.id === stepId)) return null
    const categoryDefinition = ASSET_CATEGORIES[track.category]

    const existingIndex = track.keyframes.findIndex((keyframe) => keyframe.stepId === stepId)
    let keyframe: Keyframe

    if (existingIndex !== -1) {
      keyframe = track.keyframes[existingIndex]
    } else {
      keyframe = createTrackSnapshot(track, stepId)
      track.keyframes.push(keyframe)
    }

    let selectedSprite: KeyframeSprite | null = null
    if (assetId) {
      if (categoryDefinition.keyframeCardinality === 'multi') {
        const nextOrder = keyframe.sprites.reduce(
          (maxOrder, sprite) => Math.max(maxOrder, sprite.order),
          -1
        ) + 1
        selectedSprite = {
          id: generateId('kfs'),
          assetId,
          label,
          transform: cloneTransform(transform),
          order: nextOrder
        }
        keyframe.sprites.push(selectedSprite)
      } else {
        const previousSprite = keyframe.sprites[0]
        selectedSprite = {
          id: previousSprite?.id ?? generateId('kfs'),
          assetId,
          label,
          transform: cloneTransform(transform ?? previousSprite?.transform),
          order: 0
        }
        keyframe.sprites = [selectedSprite]
      }
    } else if (categoryDefinition.keyframeCardinality === 'singleton') {
      keyframe.sprites = []
    }

    selectedTrackId.value = track.id
    navigation.value.activeStepId = stepId
    selectedKeyframeId.value = keyframe.id
    selectedSpriteId.value = selectedSprite?.id ?? null

    saveSequence()
    return selectedSprite
  }

  function getKeyframeAtStep(trackId: string, stepId: string): Keyframe | null {
    return currentSequence.value.tracks
      .find((track) => track.id === trackId)
      ?.keyframes.find((keyframe) => keyframe.stepId === stepId) ?? null
  }

  function assignAssetToGroup(
    assetId: string,
    category: AssetCategory,
    preferredGroupId?: string | null,
    label?: string,
    customCategory?: string | null
  ): KeyframeSprite | null {
    const stepId = activeStep.value?.id ?? orderedSteps.value[0]?.id
    if (!stepId) return null
    const selectedTarget = editScope.value === 'group' ? selectedGroupId.value : null
    const explicitGroup = preferredGroupId
      ? currentSequence.value.groups?.find((group) => group.id === preferredGroupId)
      : null
    const customGroup = !explicitGroup && customCategory?.trim()
      ? ensureCustomGroup(customCategory, category)
      : null
    const groupId = explicitGroup?.id ?? customGroup?.id ?? selectedTarget ?? resolveDefaultGroupId(category)
    const targetGroup = currentSequence.value.groups?.find((group) => group.id === groupId)
    if (targetGroup && !targetGroup.allowedCategories.includes(category)) {
      targetGroup.allowedCategories.push(category)
    }
    let track = currentSequence.value.tracks.find(
      (candidate) => candidate.groupId === groupId && candidate.category === category
    )
    if (!track) track = addTrack(category, label, undefined, groupId)
    const sprite = addKeyframe(track.id, stepId, assetId, label)
    const keyframe = getKeyframeAtStep(track.id, stepId)
    if (sprite && keyframe) selectSpriteForEditing(track.id, keyframe.id, sprite.id)
    return sprite
  }

  function getEffectiveKeyframeAtStep(trackId: string, stepId: string): Keyframe | null {
    const track = currentSequence.value.tracks.find((candidate) => candidate.id === trackId)
    if (!track) return null
    const snapshot = track.keyframes.find((keyframe) => keyframe.stepId === stepId) ?? null
    return snapshot?.muted ? null : snapshot
  }

  function upsertTrackStateAtStep(
    trackId: string,
    stepId: string,
    sprites?: KeyframeSprite[]
  ): Keyframe | null {
    const track = currentSequence.value.tracks.find((candidate) => candidate.id === trackId)
    if (!track) return null
    const existing = getKeyframeAtStep(trackId, stepId)
    if (existing) {
      if (sprites) existing.sprites = sprites.map(cloneKeyframeSprite)
      return existing
    }
    const keyframe = createTrackSnapshot(track, stepId, sprites ?? [])
    track.keyframes.push(keyframe)
    return keyframe
  }

  function materializeSpriteAtActiveStep(
    trackId: string,
    keyframeId: string,
    spriteId: string
  ): { keyframe: Keyframe; sprite: KeyframeSprite } | null {
    const track = currentSequence.value.tracks.find((candidate) => candidate.id === trackId)
    const sourceKeyframe = track?.keyframes.find((candidate) => candidate.id === keyframeId)
    const sourceSprite = sourceKeyframe?.sprites.find((candidate) => candidate.id === spriteId)
    const stepId = activeStep.value?.id
    if (!track || !sourceKeyframe || !sourceSprite || !stepId) return null
    if (sourceKeyframe.stepId === stepId) return { keyframe: sourceKeyframe, sprite: sourceSprite }
    const keyframe = upsertTrackStateAtStep(trackId, stepId)
    const sprite = keyframe?.sprites.find(
      (candidate) => candidate.assetId === sourceSprite.assetId && candidate.order === sourceSprite.order
    )
    return keyframe && sprite ? { keyframe, sprite } : null
  }

  function updateKeyframeSpriteTransform(
    trackId: string,
    keyframeId: string,
    spriteId: string,
    transform: Partial<Transform2D>
  ) {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (!track) return

    const keyframe = track.keyframes.find((k) => k.id === keyframeId)
    if (!keyframe) return

    const sprite = keyframe.sprites.find((candidate) => candidate.id === spriteId)
    if (!sprite) return

    sprite.transform = {
      ...sprite.transform,
      ...transform
    }
    if (!activeTransformSession.value) saveSequence()
  }

  function removeKeyframeSprite(trackId: string, keyframeId: string, spriteId: string) {
    const track = currentSequence.value.tracks.find((candidate) => candidate.id === trackId)
    const keyframe = track?.keyframes.find((candidate) => candidate.id === keyframeId)
    if (!track || !keyframe) return

    const activeTarget = activeTransformSession.value?.target
    if (
      activeTarget?.kind === 'keyframe-sprite' &&
      activeTarget.trackId === trackId &&
      activeTarget.keyframeId === keyframeId &&
      activeTarget.spriteId === spriteId
    ) {
      activeTransformSession.value = null
    }

    keyframe.sprites = keyframe.sprites.filter((sprite) => sprite.id !== spriteId)

    keyframe.sprites
      .sort((left, right) => left.order - right.order)
      .forEach((sprite, index) => {
        sprite.order = index
      })

    if (selectedSpriteId.value === spriteId) {
      selectedSpriteId.value = null
      selectedKeyframeId.value = null
      selectedTrackId.value = null
      selectedGroupId.value = null
    }
    saveSequence()
  }

  function removeSpriteFromActiveStep(trackId: string, spriteId: string): boolean {
    const step = activeStep.value
    const track = currentSequence.value.tracks.find((candidate) => candidate.id === trackId)
    const effective = step ? getEffectiveKeyframeAtStep(trackId, step.id) : null
    const sourceSprite = effective?.sprites.find((sprite) => sprite.id === spriteId)
    if (!step || !track || !effective || !sourceSprite) return false

    const beforeKeyframes = cloneKeyframes(track.keyframes)
    const current = upsertTrackStateAtStep(trackId, step.id)
    if (!current) return false
    current.sprites = current.sprites.filter(
      (sprite) => !(sprite.assetId === sourceSprite.assetId && sprite.order === sourceSprite.order)
    )
    current.sprites.forEach((sprite, index) => { sprite.order = index })

    const afterKeyframes = cloneKeyframes(track.keyframes)
    const session = activeTransformSession.value
    const entry: TrackKeyframesHistoryEntry = {
      kind: 'track-keyframes',
      trackId,
      before: beforeKeyframes,
      after: afterKeyframes
    }
    if (session) {
      session.undo.push(entry)
      session.redo = []
    } else {
      undoTransformStack.value.push(entry)
      redoTransformStack.value = []
      saveSequence()
    }
    return true
  }

  function removeKeyframe(trackId: string, keyframeId: string) {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (!track) return

    const activeTarget = activeTransformSession.value?.target
    if (
      activeTarget?.kind === 'keyframe-sprite' &&
      activeTarget.trackId === trackId &&
      activeTarget.keyframeId === keyframeId
    ) {
      activeTransformSession.value = null
    }

    const keyframe = track.keyframes.find((candidate) => candidate.id === keyframeId)
    if (keyframe) keyframe.sprites = []
    if (selectedKeyframeId.value === keyframeId) {
      selectedKeyframeId.value = null
      selectedSpriteId.value = null
    }
    saveSequence()
  }

  function toggleTrackMute(trackId: string) {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (track) {
      track.muted = !track.muted
      const keyframe = activeStep.value && getKeyframeAtStep(trackId, activeStep.value.id)
      if (keyframe) keyframe.muted = track.muted
      saveSequence()
    }
  }

  function toggleTrackLock(trackId: string) {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (track) {
      track.locked = !track.locked
      const keyframe = activeStep.value && getKeyframeAtStep(trackId, activeStep.value.id)
      if (keyframe) keyframe.locked = track.locked
      saveSequence()
    }
  }

  async function applySavedKeyframe(preset: SavedKeyframePreset): Promise<number> {
    commitTransformSession(false)
    const sequence = currentSequence.value
    const stepId = activeStep.value?.id
    if (!stepId) return 0
    const groups = sequence.groups ?? (sequence.groups = [])
    const groupIdMap = new Map<string, string>()

    for (const savedGroup of preset.groups) {
      let group = groups.find((candidate) => candidate.id === savedGroup.sourceGroupId)
        ?? groups.find((candidate) => candidate.name === savedGroup.name)
      if (!group) {
        group = {
          id: generateId('grp'),
          name: savedGroup.name,
          zIndex: savedGroup.zIndex,
          muted: false,
          locked: false,
          collapsed: false,
          allowedCategories: []
        }
        groups.push(group)
        for (const step of sequence.steps) step.groupStates.push(createGroupSnapshot(group))
      }
      group.name = savedGroup.name
      group.zIndex = savedGroup.zIndex
      group.transform = cloneTransform(savedGroup.transform)
      group.muted = false
      const groupState = getGroupStateAtStep(group.id, stepId)
      if (groupState) {
        groupState.zIndex = savedGroup.zIndex
        groupState.transform = cloneTransform(savedGroup.transform)
        groupState.muted = false
      }
      groupIdMap.set(savedGroup.sourceGroupId, group.id)
    }

    const assignedTrackIds = new Set<string>()
    const spritesByTrackId = new Map<string, SavedKeyframeSprite[]>()
    for (const savedTrack of preset.tracks) {
      let track = sequence.tracks.find(
        (candidate) => candidate.id === savedTrack.sourceTrackId && !assignedTrackIds.has(candidate.id)
      )
      if (!track) {
        track = sequence.tracks.find(
          (candidate) =>
            !assignedTrackIds.has(candidate.id) &&
            candidate.category === savedTrack.category &&
            candidate.name === savedTrack.name
        )
      }
      if (!track) {
        track = {
          id: generateId(`trk_${savedTrack.category}`),
          name: savedTrack.name,
          category: savedTrack.category,
          targetSlot: savedTrack.targetSlot,
          groupId: resolveDefaultGroupId(savedTrack.category),
          zIndex: savedTrack.zIndex,
          muted: false,
          locked: false,
          keyframes: []
        }
        sequence.tracks.push(track)
      }

      track.name = savedTrack.name
      track.targetSlot = savedTrack.targetSlot
      track.zIndex = savedTrack.zIndex
      track.muted = false
      track.groupId = savedTrack.sourceGroupId
        ? groupIdMap.get(savedTrack.sourceGroupId) ?? resolveDefaultGroupId(savedTrack.category)
        : resolveDefaultGroupId(savedTrack.category)
      const assignedGroup = groups.find((candidate) => candidate.id === track.groupId)
      if (assignedGroup && !assignedGroup.allowedCategories.includes(track.category)) {
        assignedGroup.allowedCategories.push(track.category)
      }
      assignedTrackIds.add(track.id)
      spritesByTrackId.set(track.id, savedTrack.sprites)
    }

    for (const track of sequence.tracks) {
      const savedSprites = spritesByTrackId.get(track.id) ?? []
      let keyframe = track.keyframes.find((candidate) => candidate.stepId === stepId)
      if (!keyframe) {
        keyframe = createTrackSnapshot(track, stepId)
        track.keyframes.push(keyframe)
      }
      keyframe.zIndex = track.zIndex
      keyframe.muted = false
      keyframe.locked = track.locked
      keyframe.sprites = savedSprites.map((sprite) => ({
        id: generateId('kfs'),
        assetId: sprite.assetId,
        transform: cloneTransform(sprite.transform),
        label: sprite.label,
        order: sprite.order
      }))
    }

    clearTransformHistory()
    clearStudioSelection(false)
    sequence.updatedAt = Date.now()
    await saveSequence()
    return [...spritesByTrackId.values()].reduce((count, sprites) => count + sprites.length, 0)
  }

  async function saveSequence() {
    await sequenceRepository.save(currentSequence.value)
  }

  return {
    currentSequence,
    navigation,
    orderedSteps,
    activeStep,
    activeStepIndex,
    selectedTrackId,
    selectedGroupId,
    editScope,
    selectedGroup,
    selectedKeyframeId,
    selectedSpriteId,
    selectedTrack,
    hasActiveTransformSession,
    canUndoTransform,
    canRedoTransform,
    recordTransformAction,
    beginTransformSession,
    beginTransformGesture,
    commitTransformGesture,
    commitTransformSession,
    cancelTransformSession,
    undoLastTransform,
    redoLastTransform,
    clearTransformHistory,
    selectTrackForEditing,
    selectKeyframeForEditing,
    selectSpriteForEditing,
    selectGroupForEditing,
    clearStudioSelection,
    loadSequence,
    selectStep,
    addStepAfter,
    duplicateStep,
    moveStep,
    removeStep,
    updateActiveStepCamera,
    addGroup,
    ensureCustomGroup,
    findCustomGroupByCategory,
    removeGroup,
    updateGroup,
    updateGroupTransform,
    updateGroupZIndex,
    toggleGroupCollapse,
    setGroupCollapsed,
    toggleGroupMute,
    toggleGroupLock,
    setTrackGroup,
    addTrack,
    removeTrack,
    updateTrackZIndex,
    addKeyframe,
    assignAssetToGroup,
    getKeyframeAtStep,
    getEffectiveKeyframeAtStep,
    getGroupStateAtStep,
    upsertTrackStateAtStep,
    updateKeyframeSpriteTransform,
    removeKeyframeSprite,
    removeSpriteFromActiveStep,
    removeKeyframe,
    toggleTrackMute,
    toggleTrackLock,
    applySavedKeyframe,
    saveSequence
  }
})

function cloneTransform(
  transform: Partial<Transform2D> | undefined
): Partial<Transform2D> | undefined {
  return transform ? { ...transform } : undefined
}

function transformsAreEqual(
  left: Partial<Transform2D> | undefined,
  right: Partial<Transform2D> | undefined
): boolean {
  const keys: (keyof Transform2D)[] = ['x', 'y', 'scaleX', 'scaleY', 'rotation', 'opacity']
  return keys.every((key) => left?.[key] === right?.[key])
}

function transformTargetsAreEqual(
  left: TransformHistoryTarget,
  right: TransformHistoryTarget
): boolean {
  if (left.kind !== right.kind) return false
  if (left.kind === 'group' && right.kind === 'group') {
    return left.groupId === right.groupId
  }
  if (left.kind === 'keyframe-sprite' && right.kind === 'keyframe-sprite') {
    return (
      left.trackId === right.trackId &&
      left.keyframeId === right.keyframeId &&
      left.spriteId === right.spriteId
    )
  }
  return false
}

const LEGACY_GROUP_IDS: Record<string, string> = {
  grp_backdrop: 'grp_background',
  grp_overlay: 'grp_set_props',
  grp_foreground: 'grp_set_props',
  grp_character_1: 'grp_berlu'
}

function migrateSequenceStructure(sequence: Sequence): boolean {
  let changed = false

  const persistedSequence = sequence as unknown as {
    steps?: SequenceStep[]
    durationMs?: number
    fps?: number
    tracks: Array<{ keyframes: Array<{
      id: string
      timeMs?: number
      stepId?: string
      sprites?: KeyframeSprite[]
      assetId?: string | null
      transform?: Partial<Transform2D>
      label?: string
    }> }>
  }

  if (!Array.isArray(persistedSequence.steps) || persistedSequence.steps.length === 0) {
    const times = Array.from(new Set(
      persistedSequence.tracks.flatMap((track) =>
        track.keyframes.map((keyframe) => keyframe.timeMs).filter((time): time is number => Number.isFinite(time))
      )
    )).sort((left, right) => left - right)
    if (times.length === 0) times.push(0)
    persistedSequence.steps = times.map((_time, index) => ({
      id: generateId('step'),
      label: `Étape ${String(index + 1).padStart(2, '0')}`,
      order: index,
      groupStates: [],
      camera: createDefaultCameraFrame()
    }))
    const migratedSteps = persistedSequence.steps
    const stepByTime = new Map(times.map((time, index) => [time, migratedSteps[index]?.id]))
    for (const track of persistedSequence.tracks) {
      for (const keyframe of track.keyframes) {
        keyframe.stepId = stepByTime.get(keyframe.timeMs ?? times[0] ?? 0) ?? migratedSteps[0]!.id
        delete keyframe.timeMs
      }
    }
    changed = true
  } else {
    persistedSequence.steps
      .sort((left, right) => left.order - right.order)
      .forEach((step, index) => {
        if (step.order !== index || !step.label) changed = true
        step.order = index
        step.label ||= `Étape ${String(index + 1).padStart(2, '0')}`
      })
  }
  if ('durationMs' in persistedSequence) {
    delete persistedSequence.durationMs
    changed = true
  }
  if ('fps' in persistedSequence) {
    delete persistedSequence.fps
    changed = true
  }

  if (!sequence.groups || sequence.groups.length === 0) {
    sequence.groups = createDefaultGroups()
    changed = true
  } else {
    for (const group of sequence.groups) {
      const migratedId = LEGACY_GROUP_IDS[group.id]
      if (migratedId) {
        group.id = migratedId
        changed = true
      }
    }

    sequence.groups = sequence.groups.filter(
      (group, index, groups) =>
        group.id !== 'grp_props' && groups.findIndex((candidate) => candidate.id === group.id) === index
    )

    for (const defaultGroup of createDefaultGroups()) {
      const existing = sequence.groups.find((group) => group.id === defaultGroup.id)
      if (!existing) {
        sequence.groups.push(defaultGroup)
        changed = true
      } else {
        if (existing.name !== defaultGroup.name) changed = true
        existing.name = defaultGroup.name
        existing.allowedCategories = [...defaultGroup.allowedCategories]
        existing.color = defaultGroup.color
        existing.isDefault = true
      }
    }
  }

  for (const track of sequence.tracks) {
    const category = normalizeAssetCategory(track.category)
    const targetSlot = normalizeAssetCategory(track.targetSlot) ?? category

    if (category && track.category !== category) {
      track.category = category
      changed = true
    }
    if (targetSlot && track.targetSlot !== targetSlot) {
      track.targetSlot = targetSlot
      changed = true
    }

    if (track.groupId === 'grp_props') {
      track.groupId = defaultGroupIdForCategory(track.category)
      changed = true
    } else if (track.groupId && LEGACY_GROUP_IDS[track.groupId]) {
      track.groupId = LEGACY_GROUP_IDS[track.groupId]
      changed = true
    }

    const groupExists = sequence.groups.some((group) => group.id === track.groupId)
    if (!groupExists) {
      const defaultSlot = DEFAULT_TRACK_SLOTS.find(
        (slot) => slot.category === track.category || slot.id === track.id
      )
      track.groupId = defaultSlot?.groupId ?? defaultGroupIdForCategory(track.category)
      changed = true
    }

    if (track.category === 'arms_left' && track.zIndex < 10) {
      track.zIndex = 12
      changed = true
    }

    for (const keyframe of track.keyframes) {
      const persistedKeyframe = keyframe as unknown as {
        id: string
        stepId: string
        sprites?: KeyframeSprite[]
        assetId?: string | null
        transform?: Partial<Transform2D>
        label?: string
      }

      if (!Array.isArray(persistedKeyframe.sprites)) {
        persistedKeyframe.sprites = persistedKeyframe.assetId
          ? [
              {
                id: generateId('kfs'),
                assetId: persistedKeyframe.assetId,
                transform: cloneTransform(persistedKeyframe.transform),
                label: persistedKeyframe.label,
                order: 0
              }
            ]
          : []
        delete persistedKeyframe.assetId
        delete persistedKeyframe.transform
        delete persistedKeyframe.label
        changed = true
      } else {
        persistedKeyframe.sprites.forEach((sprite, index) => {
          if (!sprite.id) {
            sprite.id = generateId('kfs')
            changed = true
          }
          if (!Number.isFinite(sprite.order)) {
            sprite.order = index
            changed = true
          }
        })
      }
    }
  }

  for (const defaultTrack of createDefaultTracks()) {
    if (!sequence.tracks.some((track) => track.category === defaultTrack.category)) {
      sequence.tracks.push(defaultTrack)
      changed = true
    }
  }

  if (ensureAutonomousSnapshots(sequence)) changed = true

  return changed
}

function createDefaultGroups(): TrackGroup[] {
  return DEFAULT_TRACK_GROUPS.map((grp) => ({
    ...grp,
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
    collapsed: false,
    muted: false,
    locked: false
  }))
}

function createDefaultTracks(): TimelineTrack[] {
  return DEFAULT_TRACK_SLOTS.map((slot) => ({
    id: slot.id,
    name: slot.name,
    category: slot.category,
    targetSlot: slot.category,
    groupId: slot.groupId,
    zIndex: slot.zIndex,
    muted: false,
    locked: false,
    keyframes: []
  }))
}

function createInitialStep(): SequenceStep {
  return {
    id: generateId('step'),
    label: 'Étape 01',
    order: 0,
    groupStates: [],
    camera: createDefaultCameraFrame()
  }
}

function createDefaultCameraFrame(): CameraFrame {
  return {
    enabled: false,
    x: 0,
    y: 0,
    width: DEFAULT_STAGE_RESOLUTION.width,
    height: DEFAULT_STAGE_RESOLUTION.height,
    aspectRatio: 'custom'
  }
}

function cloneCameraFrame(camera?: CameraFrame): CameraFrame {
  if (!camera) return createDefaultCameraFrame()

  return {
    enabled: camera.enabled,
    x: camera.x,
    y: camera.y,
    width: camera.width,
    height: camera.height,
    aspectRatio: camera.aspectRatio
  }
}

function cloneKeyframeSprite(sprite: KeyframeSprite): KeyframeSprite {
  const snapshot: KeyframeSprite = {
    id: sprite.id,
    assetId: sprite.assetId,
    transform: cloneTransform(sprite.transform),
    label: sprite.label,
    order: sprite.order
  }
  return { ...structuredClone(snapshot), id: generateId('kfs') }
}

function cloneKeyframes(keyframes: Keyframe[]): Keyframe[] {
  return keyframes.map((keyframe) => ({
    id: keyframe.id,
    stepId: keyframe.stepId,
    zIndex: keyframe.zIndex,
    muted: keyframe.muted,
    locked: keyframe.locked,
    sprites: keyframe.sprites.map((sprite) => ({
      id: sprite.id,
      assetId: sprite.assetId,
      transform: cloneTransform(sprite.transform),
      label: sprite.label,
      order: sprite.order
    }))
  }))
}

function createGroupSnapshot(group: TrackGroup): StepGroupState {
  return {
    groupId: group.id,
    zIndex: group.zIndex,
    transform: cloneTransform(group.transform),
    muted: Boolean(group.muted),
    locked: Boolean(group.locked)
  }
}

function cloneGroupStates(states: StepGroupState[]): StepGroupState[] {
  return states.map((state) => structuredClone({
    groupId: state.groupId,
    zIndex: state.zIndex,
    transform: cloneTransform(state.transform),
    muted: state.muted,
    locked: state.locked
  }))
}

function createTrackSnapshot(
  track: TimelineTrack,
  stepId: string,
  sprites: KeyframeSprite[] = []
): Keyframe {
  return {
    id: generateId('kf'),
    stepId,
    sprites: sprites.map(cloneKeyframeSprite),
    zIndex: track.zIndex,
    muted: track.muted,
    locked: track.locked
  }
}

function defaultGroupIdForCategory(category: AssetCategory): string {
  return DEFAULT_TRACK_SLOTS.find((slot) => slot.category === category)?.groupId ?? 'grp_berlu'
}

function normalizeRoutingCategory(value: string): string {
  return value
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
}

function ensureAutonomousSnapshots(sequence: Sequence): boolean {
  let changed = false
  sequence.groups ??= createDefaultGroups()
  const orderedSteps = [...sequence.steps].sort((left, right) => left.order - right.order)
  const stepIds = new Set(orderedSteps.map((step) => step.id))

  for (const group of sequence.groups) {
    const legacyGroup = group as TrackGroup & { categories?: AssetCategory[] }
    if (!Array.isArray(group.allowedCategories)) {
      group.allowedCategories = Array.isArray(legacyGroup.categories)
        ? [...legacyGroup.categories]
        : sequence.tracks
        .filter((track) => track.groupId === group.id)
        .map((track) => track.category)
      delete legacyGroup.categories
      changed = true
    }
    const isDefault = DEFAULT_TRACK_GROUPS.some((candidate) => candidate.id === group.id)
    if (group.isDefault !== isDefault) changed = true
    group.isDefault = isDefault
    if (!isDefault && !group.customCategory) {
      group.customCategory = group.name
      changed = true
    }
  }

  let previousGroupStates: StepGroupState[] = []
  let previousCamera: CameraFrame | undefined
  for (const step of orderedSteps) {
    if (!step.camera) {
      step.camera = cloneCameraFrame(previousCamera)
      changed = true
    }
    previousCamera = cloneCameraFrame(step.camera)
    if (!Array.isArray(step.groupStates)) {
      step.groupStates = []
      changed = true
    }
    for (const group of sequence.groups) {
      if (step.groupStates.some((state) => state.groupId === group.id)) continue
      const previous = previousGroupStates.find((state) => state.groupId === group.id)
      step.groupStates.push(previous ? structuredClone(previous) : createGroupSnapshot(group))
      changed = true
    }
    step.groupStates = step.groupStates.filter((state) =>
      sequence.groups?.some((group) => group.id === state.groupId)
    )
    previousGroupStates = cloneGroupStates(step.groupStates)
  }

  for (const track of sequence.tracks) {
    if (!track.groupId || !sequence.groups.some((group) => group.id === track.groupId)) {
      track.groupId = defaultGroupIdForCategory(track.category)
      changed = true
    }
    const group = sequence.groups.find((candidate) => candidate.id === track.groupId)
    if (group && !group.allowedCategories.includes(track.category)) {
      group.allowedCategories.push(track.category)
      changed = true
    }
    track.keyframes = track.keyframes.filter((keyframe) => stepIds.has(keyframe.stepId))
    let previous: Keyframe | null = null
    for (const step of orderedSteps) {
      let snapshot = track.keyframes.find((keyframe) => keyframe.stepId === step.id)
      if (!snapshot) {
        snapshot = createTrackSnapshot(track, step.id, previous?.sprites ?? [])
        if (previous) {
          snapshot.zIndex = previous.zIndex
          snapshot.muted = previous.muted
          snapshot.locked = previous.locked
        }
        track.keyframes.push(snapshot)
        changed = true
      }
      if (!Number.isFinite(snapshot.zIndex)) {
        snapshot.zIndex = previous?.zIndex ?? track.zIndex
        changed = true
      }
      if (typeof snapshot.muted !== 'boolean') {
        snapshot.muted = previous?.muted ?? track.muted
        changed = true
      }
      if (typeof snapshot.locked !== 'boolean') {
        snapshot.locked = previous?.locked ?? track.locked
        changed = true
      }
      previous = snapshot
    }
  }

  return changed
}
