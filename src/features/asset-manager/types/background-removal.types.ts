export interface BackgroundRemovalPoint {
  x: number
  y: number
}

export interface BackgroundRemovalSettings {
  seed: BackgroundRemovalPoint | null
  tolerance: number
}

export interface PreparedAssetImport {
  id: string
  file: File
  previewUrl: string
  settings: BackgroundRemovalSettings
}

export interface PixelBuffer {
  data: Uint8ClampedArray
  width: number
  height: number
}

