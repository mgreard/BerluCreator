import type { AnchoredAssetCalibration } from '@core/types/asset.types'
import type {
  ResolveAnchoredPartGeometryInput,
  ResolveAnchoredPartLocalTransformInput,
  ResolvedRigPartGeometry,
  ResolveHeadGeometryInput,
  RigLocalTransform,
  RigLayoutPoint
} from './rig-layout.types'

export function createDefaultAnchoredCalibration(): AnchoredAssetCalibration {
  return {
    pivot: { x: 0.5, y: 0.5 },
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    rotation: 0
  }
}

export function transformRigPoint(
  point: RigLayoutPoint,
  scaleOrigin: RigLayoutPoint,
  scaleX: number,
  scaleY: number,
  rotation: number,
  rotationOrigin: RigLayoutPoint = scaleOrigin
): RigLayoutPoint {
  const radians = (rotation * Math.PI) / 180
  const scaledX = scaleOrigin.x + (point.x - scaleOrigin.x) * scaleX
  const scaledY = scaleOrigin.y + (point.y - scaleOrigin.y) * scaleY
  const deltaX = scaledX - rotationOrigin.x
  const deltaY = scaledY - rotationOrigin.y

  return {
    x: rotationOrigin.x + deltaX * Math.cos(radians) - deltaY * Math.sin(radians),
    y: rotationOrigin.y + deltaX * Math.sin(radians) + deltaY * Math.cos(radians)
  }
}

export function resolveHeadGeometry(input: ResolveHeadGeometryInput): ResolvedRigPartGeometry {
  const rotationOrigin = input.rotationOrigin ?? input.scaleOrigin
  return {
    x: input.x,
    y: input.y,
    width: input.width,
    height: input.height,
    transformOriginX: input.scaleOrigin.x,
    transformOriginY: input.scaleOrigin.y,
    rotationOriginX: rotationOrigin.x,
    rotationOriginY: rotationOrigin.y,
    scaleX: input.scaleX,
    scaleY: input.scaleY,
    rotation: input.rotation
  }
}

export function resolveAnchoredPartLocalTransform(
  input: ResolveAnchoredPartLocalTransformInput
): RigLocalTransform {
  const { anchor, assetSize, calibration, headSize } = input
  return {
    x: anchor.x * headSize.width + calibration.offsetX - assetSize.width * calibration.pivot.x,
    y: anchor.y * headSize.height + calibration.offsetY - assetSize.height * calibration.pivot.y,
    scaleX: calibration.scale,
    scaleY: calibration.scale,
    rotation: calibration.rotation
  }
}

export function resolveAnchoredPartGeometry(
  input: ResolveAnchoredPartGeometryInput
): ResolvedRigPartGeometry {
  const { head, anchor, calibration, assetSize } = input
  const localUnitScaleX = input.localUnitScaleX ?? 1
  const localUnitScaleY = input.localUnitScaleY ?? 1
  const anchorPoint = transformRigPoint(
    {
      x: head.x + anchor.x * head.width,
      y: head.y + anchor.y * head.height
    },
    { x: head.transformOriginX, y: head.transformOriginY },
    head.scaleX,
    head.scaleY,
    head.rotation,
    { x: head.rotationOriginX, y: head.rotationOriginY }
  )
  const radians = (head.rotation * Math.PI) / 180
  const offsetX = calibration.offsetX * localUnitScaleX * head.scaleX
  const offsetY = calibration.offsetY * localUnitScaleY * head.scaleY
  const pivotX = anchorPoint.x + offsetX * Math.cos(radians) - offsetY * Math.sin(radians)
  const pivotY = anchorPoint.y + offsetX * Math.sin(radians) + offsetY * Math.cos(radians)

  return {
    x: pivotX - assetSize.width * calibration.pivot.x,
    y: pivotY - assetSize.height * calibration.pivot.y,
    width: assetSize.width,
    height: assetSize.height,
    transformOriginX: pivotX,
    transformOriginY: pivotY,
    rotationOriginX: pivotX,
    rotationOriginY: pivotY,
    scaleX: head.scaleX * calibration.scale,
    scaleY: head.scaleY * calibration.scale,
    rotation: head.rotation + calibration.rotation
  }
}
