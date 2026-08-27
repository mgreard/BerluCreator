import type { CameraFrame, KeyframeSprite, Sequence, Transform2D } from '@core/types/timeline.types'
import type { StageSettings } from '@core/types/project.types'
import type { ExportResolution } from '@/features/studio/composables/useCanvasRenderer'

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

function getVisibleStateSignature(sequence: Sequence, stepId: string, includeCamera: boolean): string {
  const step = sequence.steps.find((candidate) => candidate.id === stepId)
  const mutedGroups = new Set(
    (step?.groupStates ?? []).filter((group) => group.muted).map((group) => group.groupId)
  )

  return JSON.stringify({
    tracks: sequence.tracks
      .map((track) => {
        const keyframe = track.keyframes.find((candidate) => candidate.stepId === stepId)
        if (keyframe?.muted || mutedGroups.has(track.groupId)) return [track.id, null]

        return keyframe
          ? [track.id, keyframe.zIndex, [...keyframe.sprites].sort((left, right) => left.order - right.order).map(serializeSprite)]
          : [track.id, null]
      }),
    groups: step?.groupStates ?? [],
    camera: includeCamera ? step?.camera ?? null : null
  })
}

export function get1080pExportResolution(
  stage: Pick<StageSettings, 'width' | 'height'>,
  camera?: CameraFrame
): ExportResolution {
  const width = camera?.enabled ? camera.width : stage.width
  const height = camera?.enabled ? camera.height : stage.height
  const ratio = width / height

  return ratio >= 1
    ? { width: Math.round(1080 * ratio), height: 1080 }
    : { width: 1080, height: Math.round(1080 / ratio) }
}

export function getChangedKeyframeStepIds(sequence: Sequence, includeCamera = true): string[] {
  const orderedCandidates = [...sequence.steps]
    .sort((left, right) => left.order - right.order)

  const changedStepIds: string[] = []
  let previousSignature = ''

  for (const step of orderedCandidates) {
    const signature = getVisibleStateSignature(sequence, step.id, includeCamera)
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
