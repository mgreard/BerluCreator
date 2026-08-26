import type { KeyframeSprite, Sequence, Transform2D } from '@core/types/timeline.types'

const TRANSFORM_KEYS: (keyof Transform2D)[] = [
  'x',
  'y',
  'scaleX',
  'scaleY',
  'rotation',
  'opacity'
]

function serializeSprite(sprite: KeyframeSprite) {
  return {
    assetId: sprite.assetId,
    order: sprite.order,
    transform: TRANSFORM_KEYS.map((key) => sprite.transform?.[key] ?? null)
  }
}

function getVisibleStateSignature(sequence: Sequence, timeMs: number): string {
  const mutedGroups = new Set(
    (sequence.groups ?? []).filter((group) => group.muted).map((group) => group.id)
  )

  return JSON.stringify(
    sequence.tracks
      .filter((track) => !track.muted && (!track.groupId || !mutedGroups.has(track.groupId)))
      .map((track) => {
        const keyframe = [...track.keyframes]
          .sort((left, right) => left.timeMs - right.timeMs)
          .filter((candidate) => candidate.timeMs <= timeMs)
          .at(-1)

        return keyframe
          ? [track.id, [...keyframe.sprites].sort((left, right) => left.order - right.order).map(serializeSprite)]
          : [track.id, null]
      })
  )
}

export function getChangedKeyframeTimes(sequence: Sequence): number[] {
  const mutedGroups = new Set(
    (sequence.groups ?? []).filter((group) => group.muted).map((group) => group.id)
  )
  const candidateTimes = [
    ...new Set(
      sequence.tracks
        .filter((track) => !track.muted && (!track.groupId || !mutedGroups.has(track.groupId)))
        .flatMap((track) => track.keyframes.map((keyframe) => keyframe.timeMs))
    )
  ].sort((left, right) => left - right)

  const changedTimes: number[] = []
  let previousSignature = getVisibleStateSignature(sequence, -1)

  for (const timeMs of candidateTimes) {
    const signature = getVisibleStateSignature(sequence, timeMs)
    if (signature !== previousSignature) {
      changedTimes.push(timeMs)
      previousSignature = signature
    }
  }

  return changedTimes
}

export function sanitizeExportPrefix(prefix: string): string {
  return prefix
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'keyframe'
}

export function formatKeyframeFilename(prefix: string, index: number, total: number): string {
  const padding = Math.max(2, String(Math.max(1, total)).length)
  return `${sanitizeExportPrefix(prefix)}-${String(index).padStart(padding, '0')}.png`
}

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const encoded = dataUrl.split(',', 2)[1]
  if (!encoded) throw new Error('Image exportée invalide.')
  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}
