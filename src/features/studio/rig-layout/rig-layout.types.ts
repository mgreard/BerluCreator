import type { AnchoredAssetCalibration, NormalizedPoint } from '@core/types/asset.types'

export interface RigLayoutPoint {
  x: number
  y: number
}

export interface RigLayoutSize {
  width: number
  height: number
}

/** Géométrie résolue dans un même espace de coordonnées, avant arrondi de rendu. */
export interface ResolvedRigPartGeometry extends RigLayoutSize {
  x: number
  y: number
  transformOriginX: number
  transformOriginY: number
  rotationOriginX: number
  rotationOriginY: number
  scaleX: number
  scaleY: number
  rotation: number
}

export interface ResolveHeadGeometryInput extends RigLayoutSize {
  x: number
  y: number
  scaleOrigin: RigLayoutPoint
  rotationOrigin?: RigLayoutPoint
  scaleX: number
  scaleY: number
  rotation: number
}

export interface ResolveAnchoredPartGeometryInput {
  head: ResolvedRigPartGeometry
  anchor: NormalizedPoint
  calibration: AnchoredAssetCalibration
  assetSize: RigLayoutSize
  /** Taille, dans l’espace de sortie, d’un pixel natif de la tête. */
  localUnitScaleX?: number
  localUnitScaleY?: number
}

export interface ResolveAnchoredPartLocalTransformInput {
  headSize: RigLayoutSize
  assetSize: RigLayoutSize
  anchor: NormalizedPoint
  calibration: AnchoredAssetCalibration
}

export interface RigLocalTransform extends RigLayoutPoint {
  scaleX: number
  scaleY: number
  rotation: number
}
