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

function getVisibleStateSignature(sequence: Sequence, stepId: string): string {
  const mutedGroups = new Set(
    (sequence.groups ?? []).filter((group) => group.muted).map((group) => group.id)
  )

  return JSON.stringify(
    sequence.tracks
      .filter((track) => !track.muted && (!track.groupId || !mutedGroups.has(track.groupId)))
      .map((track) => {
        const targetOrder = sequence.steps.find((step) => step.id === stepId)?.order ?? -1
        const orderById = new Map(sequence.steps.map((step) => [step.id, step.order]))
        const keyframe = [...track.keyframes]
          .sort((left, right) => (orderById.get(left.stepId) ?? -1) - (orderById.get(right.stepId) ?? -1))
          .filter((candidate) => (orderById.get(candidate.stepId) ?? -1) <= targetOrder)
          .at(-1)

        return keyframe
          ? [track.id, [...keyframe.sprites].sort((left, right) => left.order - right.order).map(serializeSprite)]
          : [track.id, null]
      })
  )
}

export function getChangedKeyframeStepIds(sequence: Sequence): string[] {
  const mutedGroups = new Set(
    (sequence.groups ?? []).filter((group) => group.muted).map((group) => group.id)
  )
  const candidateStepIds = new Set(
      sequence.tracks
        .filter((track) => !track.muted && (!track.groupId || !mutedGroups.has(track.groupId)))
        .flatMap((track) => track.keyframes.map((keyframe) => keyframe.stepId))
  )
  const orderedCandidates = [...sequence.steps]
    .sort((left, right) => left.order - right.order)
    .filter((step) => candidateStepIds.has(step.id))

  const changedStepIds: string[] = []
  let previousSignature = ''

  for (const step of orderedCandidates) {
    const signature = getVisibleStateSignature(sequence, step.id)
    if (signature !== previousSignature) {
      changedStepIds.push(step.id)
      previousSignature = signature
    }
  }

  return changedStepIds
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
