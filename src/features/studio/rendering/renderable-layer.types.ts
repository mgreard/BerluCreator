import type { Asset, AssetCategory } from '@core/types/asset.types'
import type { EditorGroup, LayerDepthRole, StagePlane } from '@core/types/editor.types'
import type { Point2D } from '../engine/transform-matrix'

/** Contrat de rendu Canvas, indépendant de la manière dont une scène est résolue. */
export interface RenderableLayer {
  id: string
  layerId: string
  name: string
  category: AssetCategory
  groupId: string
  groupName: string
  groupKind: EditorGroup['kind']
  stagePlane: StagePlane
  groupZIndex: number
  layerZIndex: number
  sceneZIndex: number
  order: number
  asset: Asset
  x: number
  y: number
  width: number
  height: number
  transformOriginX: number
  transformOriginY: number
  rotationOriginX?: number
  rotationOriginY?: number
  scaleX: number
  scaleY: number
  localX: number
  localY: number
  localScaleX: number
  localScaleY: number
  localRotation: number
  rotation: number
  zIndex: number
  opacity: number
  muted: boolean
  locked: boolean
  isMovable: boolean
  depthRole: Exclude<LayerDepthRole, 'auto'>
  opticalDepth: number
  splitRole?: 'back' | 'front'
  clipPolygon?: Point2D[]
}
