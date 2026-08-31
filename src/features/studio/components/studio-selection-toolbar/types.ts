export type DeskPlacement = 'behind' | 'front'

export interface StudioSelectionToolbarProps {
  open: boolean
  layerName: string
  layerIcon: string
  canEditDeskPlacement: boolean
  deskPlacement: DeskPlacement
  canEditDeskSplit: boolean
  deskSplitOpen: boolean
  blurEnabled?: boolean
  flipped: boolean
  deleteLabel: string
}
