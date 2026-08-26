import type { AssetCategory } from '@core/types/asset.types'
import type { TimelineTrack } from '@core/types/timeline.types'

function trackMatchesCategory(track: TimelineTrack, category: AssetCategory) {
  return track.targetSlot === category || track.category === category
}

export function findAssetTargetTrack(
  tracks: TimelineTrack[],
  selectedTrack: TimelineTrack | null | undefined,
  category: AssetCategory,
  activeGroupId?: string | null
) {
  if (activeGroupId) {
    if (
      selectedTrack?.groupId === activeGroupId &&
      trackMatchesCategory(selectedTrack, category)
    ) {
      return selectedTrack
    }

    return tracks.find(
      (track) => track.groupId === activeGroupId && trackMatchesCategory(track, category)
    )
  }

  if (selectedTrack && trackMatchesCategory(selectedTrack, category)) {
    return selectedTrack
  }

  return tracks.find((track) => trackMatchesCategory(track, category))
}

export function resolveAssetAssignmentStep(
  targetTrack: TimelineTrack,
  selectedTrack: TimelineTrack | null | undefined,
  selectedKeyframeId: string | null,
  activeStepId: string
) {
  if (targetTrack.id !== selectedTrack?.id) {
    return activeStepId
  }

  return (
    targetTrack.keyframes.find((keyframe) => keyframe.id === selectedKeyframeId)?.stepId ??
    activeStepId
  )
}
