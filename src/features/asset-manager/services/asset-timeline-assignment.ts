import type { AssetCategory } from '@core/types/asset.types'
import type { TimelineTrack } from '@core/types/timeline.types'

function trackMatchesCategory(track: TimelineTrack, category: AssetCategory) {
  return track.targetSlot === category || track.category === category
}

export function findAssetTargetTrack(
  tracks: TimelineTrack[],
  selectedTrack: TimelineTrack | null | undefined,
  category: AssetCategory
) {
  if (selectedTrack && trackMatchesCategory(selectedTrack, category)) {
    return selectedTrack
  }

  return tracks.find((track) => trackMatchesCategory(track, category))
}

export function resolveAssetAssignmentTime(
  targetTrack: TimelineTrack,
  selectedTrack: TimelineTrack | null | undefined,
  selectedKeyframeId: string | null,
  currentTimeMs: number
) {
  if (targetTrack.id !== selectedTrack?.id) {
    return currentTimeMs
  }

  return (
    targetTrack.keyframes.find((keyframe) => keyframe.id === selectedKeyframeId)?.timeMs ??
    currentTimeMs
  )
}
