import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Sequence,
  TimelineTrack,
  TrackGroup,
  TrackGroupColor,
  Keyframe,
  KeyframeSprite,
  PlaybackState,
  Transform2D,
  SavedKeyframePreset,
  SavedKeyframeSprite
} from '@core/types/timeline.types'
import { normalizeAssetCategory, type AssetCategory } from '@core/types/asset.types'
import {
  DEFAULT_TIMELINE_FPS,
  DEFAULT_SEQUENCE_DURATION_MS,
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
  target: TransformHistoryTarget
  before: Partial<Transform2D> | undefined
  after: Partial<Transform2D> | undefined
}

interface TransformEditSession {
  target: TransformHistoryTarget
  before: Partial<Transform2D> | undefined
}

const MAX_TRANSFORM_HISTORY = 50

export const useTimelineStore = defineStore('timeline', () => {
  const currentSequence = ref<Sequence>({
    id: 'seq_default',
    projectId: 'proj_default',
    name: 'Séquence Principale',
    durationMs: DEFAULT_SEQUENCE_DURATION_MS,
    fps: DEFAULT_TIMELINE_FPS,
    groups: createDefaultGroups(),
    tracks: createDefaultTracks(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  })

  const playback = ref<PlaybackState>({
    isPlaying: false,
    currentTimeMs: 0,
    speed: 1,
    loop: true,
    zoom: 120, // 120 px par seconde
    snapToGrid: true,
    gridStepMs: 100
  })

  const selectedTrackId = ref<string | null>(null)
  const selectedGroupId = ref<string | null>(null)
  const selectedKeyframeId = ref<string | null>(null)
  const selectedSpriteId = ref<string | null>(null)
  const editScope = ref<'group' | 'layer'>('layer')
  const undoTransformStack = ref<TransformHistoryEntry[]>([])
  const redoTransformStack = ref<TransformHistoryEntry[]>([])
  const activeTransformSession = ref<TransformEditSession | null>(null)

  let animationFrameId: number | null = null
  let lastTimestamp: number | null = null

  const currentTimeSeconds = computed(() => (playback.value.currentTimeMs / 1000).toFixed(2))

  const selectedTrack = computed(() => {
    return currentSequence.value.tracks.find((t) => t.id === selectedTrackId.value) ?? null
  })

  const selectedGroup = computed(() => {
    return currentSequence.value.groups?.find((g) => g.id === selectedGroupId.value) ?? null
  })

  const hasActiveTransformSession = computed(() => activeTransformSession.value !== null)
  const canUndoTransform = computed(
    () => !hasActiveTransformSession.value && undoTransformStack.value.length > 0
  )
  const canRedoTransform = computed(
    () => !hasActiveTransformSession.value && redoTransformStack.value.length > 0
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
    const entry = undoTransformStack.value.pop()
    if (!entry) return

    if (applyTransformSnapshot(entry.target, entry.before)) {
      redoTransformStack.value.push(entry)
    }
  }

  function redoLastTransform() {
    const entry = redoTransformStack.value.pop()
    if (!entry) return

    if (applyTransformSnapshot(entry.target, entry.after)) {
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
      before: readTransformSnapshot(target)
    }
  }

  function commitTransformSession(clearSelection = true) {
    const session = activeTransformSession.value
    if (!session) {
      if (clearSelection) clearStudioSelection(false)
      return
    }

    recordTransformAction(
      session.target,
      session.before,
      readTransformSnapshot(session.target)
    )
    activeTransformSession.value = null
    if (clearSelection) clearStudioSelection(false)
  }

  function cancelTransformSession(clearSelection = true) {
    const session = activeTransformSession.value
    if (session) {
      applyTransformSnapshot(session.target, session.before)
      activeTransformSession.value = null
    }
    if (clearSelection) clearStudioSelection(false)
  }

  function applyTransformSnapshot(
    target: TransformHistoryTarget,
    snapshot: Partial<Transform2D> | undefined
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

    saveSequence()
    return true
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

    selectedTrackId.value = track.id
    selectedGroupId.value = track.groupId ?? null
    selectedKeyframeId.value = keyframe.id
    selectedSpriteId.value = sprite.id
    editScope.value = 'layer'
    if (track.groupId) setGroupCollapsed(track.groupId, false)
    beginTransformSession({
      kind: 'keyframe-sprite',
      trackId: track.id,
      keyframeId: keyframe.id,
      spriteId: sprite.id
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
      if (wasMigrated) await sequenceRepository.save(seq)
    } else {
      currentSequence.value.id = sequenceId
      currentSequence.value.projectId = projectId
      await sequenceRepository.save(currentSequence.value)
    }
  }

  // =========================================================================
  // Horloge & Contrôles de Transport
  // =========================================================================

  function play() {
    if (playback.value.isPlaying) return
    playback.value.isPlaying = true
    lastTimestamp = performance.now()
    runPlaybackLoop()
  }

  function pause() {
    playback.value.isPlaying = false
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    lastTimestamp = null
  }

  function togglePlay() {
    if (playback.value.isPlaying) {
      pause()
    } else {
      play()
    }
  }

  function stop() {
    pause()
    playback.value.currentTimeMs = 0
  }

  function seek(timeMs: number) {
    const clamped = Math.max(0, Math.min(timeMs, currentSequence.value.durationMs))
    playback.value.currentTimeMs = playback.value.snapToGrid
      ? Math.round(clamped / playback.value.gridStepMs) * playback.value.gridStepMs
      : clamped
  }

  function runPlaybackLoop() {
    if (!playback.value.isPlaying) return

    animationFrameId = requestAnimationFrame((now) => {
      if (lastTimestamp !== null) {
        const delta = (now - lastTimestamp) * playback.value.speed
        let nextTime = playback.value.currentTimeMs + delta

        if (nextTime >= currentSequence.value.durationMs) {
          if (playback.value.loop) {
            nextTime = 0
          } else {
            nextTime = currentSequence.value.durationMs
            pause()
          }
        }
        playback.value.currentTimeMs = nextTime
      }

      lastTimestamp = now
      if (playback.value.isPlaying) {
        runPlaybackLoop()
      }
    })
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
    timeMs: number,
    assetId: string | null,
    label?: string,
    transform?: Partial<Transform2D>
  ): KeyframeSprite | null {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (!track) return null

    const clampedTime = Math.max(0, Math.min(timeMs, currentSequence.value.durationMs))
    const categoryDefinition = ASSET_CATEGORIES[track.category]

    // Vérifier si une keyframe existe déjà exactement à ce timestamp
    const existingIndex = track.keyframes.findIndex((k) => Math.abs(k.timeMs - clampedTime) < 10)
    let keyframe: Keyframe

    if (existingIndex !== -1) {
      keyframe = track.keyframes[existingIndex]
    } else {
      keyframe = {
        id: generateId('kf'),
        timeMs: clampedTime,
        sprites: []
      }
      track.keyframes.push(keyframe)
      track.keyframes.sort((a, b) => a.timeMs - b.timeMs)
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
    selectedKeyframeId.value = keyframe.id
    selectedSpriteId.value = selectedSprite?.id ?? null

    saveSequence()
    return selectedSprite
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
    saveSequence()
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

  function moveKeyframe(trackId: string, keyframeId: string, newTimeMs: number) {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (!track) return

    const keyframe = track.keyframes.find((k) => k.id === keyframeId)
    if (!keyframe) return

    keyframe.timeMs = Math.max(0, Math.min(newTimeMs, currentSequence.value.durationMs))
    track.keyframes.sort((a, b) => a.timeMs - b.timeMs)
    saveSequence()
  }

  function getActiveKeyframeAtTime(trackId: string, timeMs: number): Keyframe | null {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (!track || track.muted || track.keyframes.length === 0) return null

    // Trouve la keyframe la plus récente antérieure ou égale à timeMs
    let active: Keyframe | null = null
    for (const kf of track.keyframes) {
      if (kf.timeMs <= timeMs) {
        active = kf
      } else {
        break
      }
    }
    return active
  }

  function toggleTrackMute(trackId: string) {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (track) track.muted = !track.muted
  }

  function toggleTrackLock(trackId: string) {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (track) track.locked = !track.locked
  }

  function setDuration(durationMs: number) {
    currentSequence.value.durationMs = durationMs
    saveSequence()
  }

  function setFps(fps: number) {
    currentSequence.value.fps = fps
    saveSequence()
  }

  async function applySavedKeyframe(preset: SavedKeyframePreset): Promise<number> {
    pause()
    commitTransformSession(false)
    const sequence = currentSequence.value
    const timeMs = Math.max(0, Math.min(playback.value.currentTimeMs, sequence.durationMs))
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
      let keyframe = track.keyframes.find((candidate) => Math.abs(candidate.timeMs - timeMs) < 10)
      if (!keyframe) {
        keyframe = { id: generateId('kf'), timeMs, sprites: [] }
        track.keyframes.push(keyframe)
        track.keyframes.sort((left, right) => left.timeMs - right.timeMs)
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
    playback,
    selectedTrackId,
    selectedGroupId,
    editScope,
    selectedGroup,
    selectedKeyframeId,
    selectedSpriteId,
    selectedTrack,
    currentTimeSeconds,
    hasActiveTransformSession,
    canUndoTransform,
    canRedoTransform,
    recordTransformAction,
    beginTransformSession,
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
    play,
    pause,
    togglePlay,
    stop,
    seek,
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
    updateKeyframeSpriteTransform,
    removeKeyframeSprite,
    removeKeyframe,
    moveKeyframe,
    getActiveKeyframeAtTime,
    toggleTrackMute,
    toggleTrackLock,
    setDuration,
    setFps,
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
        timeMs: number
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
