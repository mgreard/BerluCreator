import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Sequence, TimelineTrack, TrackGroup, TrackGroupColor, Keyframe, PlaybackState, Transform2D } from '@core/types/timeline.types'
import type { AssetCategory } from '@core/types/asset.types'
import {
  DEFAULT_TIMELINE_FPS,
  DEFAULT_SEQUENCE_DURATION_MS,
  DEFAULT_TRACK_SLOTS,
  DEFAULT_TRACK_GROUPS
} from '@core/constants/timeline'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { sequenceRepository } from '@infrastructure/db/repositories/sequence.repository'
import { generateId } from '@/lib/utils'

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

  let animationFrameId: number | null = null
  let lastTimestamp: number | null = null

  const currentTimeSeconds = computed(() => (playback.value.currentTimeMs / 1000).toFixed(2))

  const selectedTrack = computed(() => {
    return currentSequence.value.tracks.find((t) => t.id === selectedTrackId.value) ?? null
  })

  const selectedGroup = computed(() => {
    return currentSequence.value.groups?.find((g) => g.id === selectedGroupId.value) ?? null
  })

  /**
   * Initialise ou charge la séquence depuis Dexie
   */
  async function loadSequence(sequenceId: string, projectId: string) {
    const seq = await sequenceRepository.getById(sequenceId)
    if (seq) {
      // S'assurer que les groupes existent pour la rétrocompatibilité
      if (!seq.groups || seq.groups.length === 0) {
        seq.groups = createDefaultGroups()
      }

      // S'assurer que chaque piste a son groupId et zIndex canonique
      for (const t of seq.tracks) {
        if (!t.groupId) {
          const defaultSlot = DEFAULT_TRACK_SLOTS.find((s) => s.category === t.category || s.id === t.id)
          t.groupId = defaultSlot?.groupId || 'grp_character_1'
        }
        if (t.category === 'arms_left' && t.zIndex < 10) {
          t.zIndex = 12
        }
      }
      currentSequence.value = seq
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
    selectedGroupId.value = newGroup.id
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
      selectedGroupId.value = null
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
    if (!currentSequence.value.groups) return
    const group = currentSequence.value.groups.find((g) => g.id === groupId)
    if (group) {
      group.collapsed = !group.collapsed
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
    const trackZIndex = zIndex ?? (catDef?.defaultZIndex ? catDef.defaultZIndex + existingSameCat.length : 30)

    // Déterminer le groupId par défaut si non spécifié
    let targetGroupId = groupId
    if (!targetGroupId && currentSequence.value.groups && currentSequence.value.groups.length > 0) {
      if (category === 'backdrop') {
        targetGroupId = currentSequence.value.groups.find((g) => g.id === 'grp_backdrop')?.id || currentSequence.value.groups[0].id
      } else if (category === 'overlay') {
        targetGroupId = currentSequence.value.groups.find((g) => g.id === 'grp_overlay')?.id || currentSequence.value.groups[0].id
      } else if (category === 'props') {
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
    selectedTrackId.value = newTrack.id
    saveSequence()
    return newTrack
  }

  function removeTrack(trackId: string) {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (!track) return

    // Les singletons fondamentaux de base ne doivent pas être supprimés si c'est la seule piste
    const catDef = ASSET_CATEGORIES[track.category]
    if (catDef && catDef.cardinality === 'singleton') {
      const sameCatCount = currentSequence.value.tracks.filter((t) => t.category === track.category).length
      if (sameCatCount <= 1) return
    }

    currentSequence.value.tracks = currentSequence.value.tracks.filter((t) => t.id !== trackId)
    if (selectedTrackId.value === trackId) {
      selectedTrackId.value = currentSequence.value.tracks[0]?.id ?? null
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
  ) {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (!track) return

    const clampedTime = Math.max(0, Math.min(timeMs, currentSequence.value.durationMs))

    // Vérifier si une keyframe existe déjà exactement à ce timestamp
    const existingIndex = track.keyframes.findIndex((k) => Math.abs(k.timeMs - clampedTime) < 10)

    if (existingIndex !== -1) {
      track.keyframes[existingIndex].assetId = assetId
      if (label !== undefined) track.keyframes[existingIndex].label = label
      if (transform !== undefined) track.keyframes[existingIndex].transform = transform
      selectedKeyframeId.value = track.keyframes[existingIndex].id
    } else {
      const newKeyframe: Keyframe = {
        id: generateId('kf'),
        timeMs: clampedTime,
        assetId,
        label,
        transform
      }
      track.keyframes.push(newKeyframe)
      track.keyframes.sort((a, b) => a.timeMs - b.timeMs)
      selectedKeyframeId.value = newKeyframe.id
    }

    saveSequence()
  }

  function updateKeyframeTransform(trackId: string, keyframeId: string, transform: Partial<Transform2D>) {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (!track) return

    const keyframe = track.keyframes.find((k) => k.id === keyframeId)
    if (!keyframe) return

    keyframe.transform = {
      ...keyframe.transform,
      ...transform
    }
    saveSequence()
  }

  function removeKeyframe(trackId: string, keyframeId: string) {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (!track) return

    track.keyframes = track.keyframes.filter((k) => k.id !== keyframeId)
    if (selectedKeyframeId.value === keyframeId) {
      selectedKeyframeId.value = null
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

  async function saveSequence() {
    await sequenceRepository.save(currentSequence.value)
  }

  return {
    currentSequence,
    playback,
    selectedTrackId,
    selectedGroupId,
    selectedGroup,
    selectedKeyframeId,
    selectedTrack,
    currentTimeSeconds,
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
    toggleGroupMute,
    toggleGroupLock,
    setTrackGroup,
    addTrack,
    removeTrack,
    updateTrackZIndex,
    addKeyframe,
    updateKeyframeTransform,
    removeKeyframe,
    moveKeyframe,
    getActiveKeyframeAtTime,
    toggleTrackMute,
    toggleTrackLock,
    setDuration,
    setFps,
    saveSequence
  }
})

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
