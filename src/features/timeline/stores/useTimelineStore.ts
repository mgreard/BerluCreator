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
  Transform2D,
  SavedKeyframePreset,
  SavedKeyframeSprite
} from '@core/types/timeline.types'
import { normalizeAssetCategory, type AssetCategory } from '@core/types/asset.types'
import { DEFAULT_TRACK_SLOTS, DEFAULT_TRACK_GROUPS } from '@core/constants/timeline'
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
    if (activeTransformSession.value) commitTransformSession(false)
    navigation.value.activeStepId = stepId
    selectedKeyframeId.value = null
    selectedSpriteId.value = null
  }

  function addStepAfter(afterStepId = activeStep.value?.id): SequenceStep {
    const steps = orderedSteps.value
    const afterIndex = Math.max(0, steps.findIndex((step) => step.id === afterStepId))
    const step: SequenceStep = {
      id: generateId('step'),
      label: '',
      order: afterIndex + 1
    }
    for (const candidate of steps.slice(afterIndex + 1)) candidate.order += 1
    currentSequence.value.steps.push(step)
    normalizeStepOrders()
    navigation.value.activeStepId = step.id
    clearStudioSelection(false)
    saveSequence()
    return step
  }

  function duplicateStep(stepId = activeStep.value?.id): SequenceStep | null {
    if (!stepId) return null
    const sourceStep = currentSequence.value.steps.find((step) => step.id === stepId)
    if (!sourceStep) return null
    const newStep = addStepAfter(stepId)
    for (const track of currentSequence.value.tracks) {
      const effective = getEffectiveKeyframeAtStep(track.id, stepId)
      if (!effective) continue
      track.keyframes.push({
        id: generateId('kf'),
        stepId: newStep.id,
        sprites: effective.sprites.map(cloneKeyframeSprite)
      })
    }
    saveSequence()
    return newStep
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
    clearStudioSelection(false)
    clearTransformHistory()
    saveSequence()
  }

  // =========================================================================
  // Gestion des Groupes de Pistes
  // =========================================================================

  function addGroup(name: string, zIndex?: number, color?: TrackGroupColor): TrackGroup {
    if (!currentSequence.value.groups) {
      currentSequence.value.groups = []
    }

    const defaultZ = zIndex ?? (currentSequence.value.groups.length > 0
      ? Math.max(...currentSequence.value.groups.map((g) => g.zIndex)) + 10
      : 20)

    const newGroup: TrackGroup = {
      id: generateId('grp'),
      name: name.trim() || 'Nouveau Groupe',
      zIndex: defaultZ,
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
      muted: false,
      locked: false,
      collapsed: false,
      color: color || 'indigo'
    }

    currentSequence.value.groups.push(newGroup)
    selectGroupForEditing(newGroup.id)
    saveSequence()
    return newGroup
  }

  function removeGroup(groupId: string, deleteTracks: boolean = false) {
    if (!currentSequence.value.groups) return

    if (deleteTracks) {
      currentSequence.value.tracks = currentSequence.value.tracks.filter((t) => t.groupId !== groupId)
    } else {
      // Réassigner les pistes orphelines vers un groupe restant ou undefined
      const remainingGroup = currentSequence.value.groups.find((g) => g.id !== groupId)
      for (const track of currentSequence.value.tracks) {
        if (track.groupId === groupId) {
          track.groupId = remainingGroup?.id
        }
      }
    }

    currentSequence.value.groups = currentSequence.value.groups.filter((g) => g.id !== groupId)
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
      saveSequence()
    }
  }

  function updateGroupZIndex(groupId: string, zIndex: number) {
    if (!currentSequence.value.groups) return
    const group = currentSequence.value.groups.find((g) => g.id === groupId)
    if (group) {
      group.zIndex = zIndex
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
    }
  }

  function toggleGroupLock(groupId: string) {
    if (!currentSequence.value.groups) return
    const group = currentSequence.value.groups.find((g) => g.id === groupId)
    if (group) {
      group.locked = !group.locked
    }
  }

  function setTrackGroup(trackId: string, groupId: string | null) {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (track) {
      track.groupId = groupId ?? undefined
      saveSequence()
    }
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

    // Déterminer le groupId par défaut si non spécifié
    let targetGroupId = groupId
    if (!targetGroupId && currentSequence.value.groups && currentSequence.value.groups.length > 0) {
      if (category === 'background') {
        targetGroupId = currentSequence.value.groups.find((g) => g.id === 'grp_background')?.id || currentSequence.value.groups[0].id
      } else if (category === 'foreground') {
        targetGroupId = currentSequence.value.groups.find((g) => g.id === 'grp_foreground')?.id || currentSequence.value.groups[0].id
      } else if (['props_set', 'desk', 'props_desk'].includes(category)) {
        targetGroupId = currentSequence.value.groups.find((g) => g.id === 'grp_props')?.id || currentSequence.value.groups[0].id
      } else {
        targetGroupId = currentSequence.value.groups.find((g) => g.id === 'grp_character_1')?.id || currentSequence.value.groups[0].id
      }
    }

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
      keyframe = {
        id: generateId('kf'),
        stepId,
        sprites: []
      }
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

  function getEffectiveKeyframeAtStep(trackId: string, stepId: string): Keyframe | null {
    const track = currentSequence.value.tracks.find((candidate) => candidate.id === trackId)
    if (!track || track.muted) return null
    const targetOrder = currentSequence.value.steps.find((step) => step.id === stepId)?.order
    if (targetOrder === undefined) return null
    const orderById = new Map(currentSequence.value.steps.map((step) => [step.id, step.order]))
    return track.keyframes.reduce<Keyframe | null>((active, keyframe) => {
      const order = orderById.get(keyframe.stepId)
      if (order === undefined || order > targetOrder) return active
      if (!active) return keyframe
      return order > (orderById.get(active.stepId) ?? -1) ? keyframe : active
    }, null)
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
    const inherited = getEffectiveKeyframeAtStep(trackId, stepId)
    const keyframe: Keyframe = {
      id: generateId('kf'),
      stepId,
      sprites: (sprites ?? inherited?.sprites ?? []).map(cloneKeyframeSprite)
    }
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
    if (keyframe.sprites.length === 0) {
      removeKeyframe(trackId, keyframeId)
      return
    }

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
    const before = effective.sprites.map(cloneKeyframeSprite)
    const current = upsertTrackStateAtStep(trackId, step.id)
    if (!current) return false
    current.sprites = current.sprites.filter(
      (sprite) => !(sprite.assetId === sourceSprite.assetId && sprite.order === sourceSprite.order)
    )
    current.sprites.forEach((sprite, index) => { sprite.order = index })

    const nextStep = orderedSteps.value[activeStepIndex.value + 1]
    if (nextStep && !getKeyframeAtStep(trackId, nextStep.id)) {
      track.keyframes.push({ id: generateId('kf'), stepId: nextStep.id, sprites: before })
    }
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

    track.keyframes = track.keyframes.filter((k) => k.id !== keyframeId)
    if (selectedKeyframeId.value === keyframeId) {
      selectedKeyframeId.value = null
      selectedSpriteId.value = null
    }
    saveSequence()
  }

  function toggleTrackMute(trackId: string) {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (track) track.muted = !track.muted
  }

  function toggleTrackLock(trackId: string) {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (track) track.locked = !track.locked
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
          collapsed: false
        }
        groups.push(group)
      }
      group.name = savedGroup.name
      group.zIndex = savedGroup.zIndex
      group.transform = cloneTransform(savedGroup.transform)
      group.muted = false
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
        ? groupIdMap.get(savedTrack.sourceGroupId) ?? savedTrack.sourceGroupId
        : undefined
      assignedTrackIds.add(track.id)
      spritesByTrackId.set(track.id, savedTrack.sprites)
    }

    for (const track of sequence.tracks) {
      const savedSprites = spritesByTrackId.get(track.id) ?? []
      let keyframe = track.keyframes.find((candidate) => candidate.stepId === stepId)
      if (!keyframe) {
        keyframe = { id: generateId('kf'), stepId, sprites: [] }
        track.keyframes.push(keyframe)
      }
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
    addGroup,
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
    getKeyframeAtStep,
    getEffectiveKeyframeAtStep,
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
  grp_overlay: 'grp_foreground'
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
      order: index
    }))
    const stepByTime = new Map(times.map((time, index) => [time, persistedSequence.steps?.[index]?.id]))
    for (const track of persistedSequence.tracks) {
      for (const keyframe of track.keyframes) {
        keyframe.stepId = stepByTime.get(keyframe.timeMs ?? times[0] ?? 0) ?? persistedSequence.steps[0]!.id
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

    for (const defaultGroup of createDefaultGroups()) {
      if (!sequence.groups.some((group) => group.id === defaultGroup.id)) {
        sequence.groups.push(defaultGroup)
        changed = true
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

    if (track.groupId && LEGACY_GROUP_IDS[track.groupId]) {
      track.groupId = LEGACY_GROUP_IDS[track.groupId]
      changed = true
    }

    const groupExists = sequence.groups.some((group) => group.id === track.groupId)
    if (!groupExists) {
      const defaultSlot = DEFAULT_TRACK_SLOTS.find(
        (slot) => slot.category === track.category || slot.id === track.id
      )
      track.groupId = defaultSlot?.groupId ?? 'grp_character_1'
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
  return { id: generateId('step'), label: 'Étape 01', order: 0 }
}

function cloneKeyframeSprite(sprite: KeyframeSprite): KeyframeSprite {
  return {
    id: generateId('kfs'),
    assetId: sprite.assetId,
    transform: cloneTransform(sprite.transform),
    label: sprite.label,
    order: sprite.order
  }
}

function cloneKeyframes(keyframes: Keyframe[]): Keyframe[] {
  return keyframes.map((keyframe) => ({
    id: keyframe.id,
    stepId: keyframe.stepId,
    sprites: keyframe.sprites.map((sprite) => ({
      id: sprite.id,
      assetId: sprite.assetId,
      transform: cloneTransform(sprite.transform),
      label: sprite.label,
      order: sprite.order
    }))
  }))
}
