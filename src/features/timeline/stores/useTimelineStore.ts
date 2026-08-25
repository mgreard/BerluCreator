import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Sequence, TimelineTrack, Keyframe, PlaybackState } from '@core/types/timeline.types'
import {
  DEFAULT_TIMELINE_FPS,
  DEFAULT_SEQUENCE_DURATION_MS,
  DEFAULT_TRACK_SLOTS
} from '@core/constants/timeline'
import { sequenceRepository } from '@infrastructure/db/repositories/sequence.repository'
import { generateId } from '@/lib/utils'

export const useTimelineStore = defineStore('timeline', () => {
  const currentSequence = ref<Sequence>({
    id: 'seq_default',
    projectId: 'proj_default',
    name: 'Séquence Principale',
    durationMs: DEFAULT_SEQUENCE_DURATION_MS,
    fps: DEFAULT_TIMELINE_FPS,
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
  const selectedKeyframeId = ref<string | null>(null)

  let animationFrameId: number | null = null
  let lastTimestamp: number | null = null

  const currentTimeSeconds = computed(() => (playback.value.currentTimeMs / 1000).toFixed(2))

  const selectedTrack = computed(() => {
    return currentSequence.value.tracks.find((t) => t.id === selectedTrackId.value) ?? null
  })

  /**
   * Initialise ou charge la séquence depuis Dexie
   */
  async function loadSequence(sequenceId: string, projectId: string) {
    const seq = await sequenceRepository.getById(sequenceId)
    if (seq) {
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
  // Gestion des Pistes & Keyframes
  // =========================================================================

  function addKeyframe(trackId: string, timeMs: number, assetId: string | null, label?: string) {
    const track = currentSequence.value.tracks.find((t) => t.id === trackId)
    if (!track) return

    const clampedTime = Math.max(0, Math.min(timeMs, currentSequence.value.durationMs))

    // Vérifier si une keyframe existe déjà exactement à ce timestamp
    const existingIndex = track.keyframes.findIndex((k) => Math.abs(k.timeMs - clampedTime) < 10)

    if (existingIndex !== -1) {
      track.keyframes[existingIndex].assetId = assetId
      if (label) track.keyframes[existingIndex].label = label
      selectedKeyframeId.value = track.keyframes[existingIndex].id
    } else {
      const newKeyframe: Keyframe = {
        id: generateId('kf'),
        timeMs: clampedTime,
        assetId,
        label
      }
      track.keyframes.push(newKeyframe)
      track.keyframes.sort((a, b) => a.timeMs - b.timeMs)
      selectedKeyframeId.value = newKeyframe.id
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
    selectedKeyframeId,
    selectedTrack,
    currentTimeSeconds,
    loadSequence,
    play,
    pause,
    togglePlay,
    stop,
    seek,
    addKeyframe,
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

function createDefaultTracks(): TimelineTrack[] {
  return DEFAULT_TRACK_SLOTS.map((slot) => ({
    id: slot.id,
    name: slot.name,
    category: slot.category,
    targetSlot: slot.category,
    zIndex: slot.zIndex,
    muted: false,
    locked: false,
    keyframes: []
  }))
}
