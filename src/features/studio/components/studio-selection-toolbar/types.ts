import type { OpticalDepthPreset } from '../optical-depth-controls'

export type DeskPlacement = 'behind' | 'front'

export interface StudioSelectionToolbarProps {
  open: boolean
  layerName: string
  layerIcon: string
  canEditDeskPlacement: boolean
  deskPlacement: DeskPlacement
  canEditOpticalDepth: boolean
  opticalDepthOpen: boolean
  opticalDepthPercent: number
  opticalDepthPreset: OpticalDepthPreset
  opticalDepthLabel: string
  canEditDeskSplit: boolean
  deskSplitOpen: boolean
  flipped: boolean
  deleteLabel: string
}
