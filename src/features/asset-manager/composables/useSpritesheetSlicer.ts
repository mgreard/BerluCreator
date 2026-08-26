import { ref, computed, watch } from 'vue'
import type { AssetCategory, SpritesheetSlice } from '@core/types/asset.types'
import { generateId } from '@/lib/utils'

export function normalizeSliceRect(
  rect: { x: number; y: number; width: number; height: number },
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; width: number; height: number } {
  const rawStartX = Math.min(rect.x, rect.x + rect.width)
  const rawEndX = Math.max(rect.x, rect.x + rect.width)
  const rawStartY = Math.min(rect.y, rect.y + rect.height)
  const rawEndY = Math.max(rect.y, rect.y + rect.height)

  const x = Math.round(Math.max(0, Math.min(imageWidth, rawStartX)))
  const y = Math.round(Math.max(0, Math.min(imageHeight, rawStartY)))
  const endX = Math.round(Math.max(0, Math.min(imageWidth, rawEndX)))
  const endY = Math.round(Math.max(0, Math.min(imageHeight, rawEndY)))

  return {
    x,
    y,
    width: Math.max(0, endX - x),
    height: Math.max(0, endY - y)
  }
}

export function useSpritesheetSlicer() {
  const file = ref<File | null>(null)
  const imageSrc = ref<string | null>(null)
  const imageElement = ref<HTMLImageElement | null>(null)
  const naturalWidth = ref(0)
  const naturalHeight = ref(0)
  const isImageLoading = ref(false)

  const slices = ref<SpritesheetSlice[]>([])
  const selectedSliceId = ref<string | null>(null)
  const defaultCategory = ref<AssetCategory>('mouth')
  const zoom = ref(1)

  const selectedSlice = computed(() => {
    return slices.value.find((s) => s.id === selectedSliceId.value) ?? null
  })

  // Nettoyage de l'URL objet
  watch(
    () => imageSrc.value,
    (_newUrl, oldUrl) => {
      if (oldUrl && oldUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldUrl)
      }
    }
  )

  async function loadFile(uploadedFile: File): Promise<void> {
    file.value = uploadedFile
    isImageLoading.value = true
    slices.value = []
    selectedSliceId.value = null
    zoom.value = 1

    const url = URL.createObjectURL(uploadedFile)
    imageSrc.value = url

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        imageElement.value = img
        naturalWidth.value = img.naturalWidth
        naturalHeight.value = img.naturalHeight
        isImageLoading.value = false
        resolve()
      }
      img.onerror = (err) => {
        isImageLoading.value = false
        reject(err)
      }
      img.src = url
    })
  }

  function addSlice(
    rect: { x: number; y: number; width: number; height: number },
    category?: AssetCategory
  ): SpritesheetSlice {
    // Normaliser les coordonnées (au cas où le tracé a été fait de droite à gauche ou bas vers haut)
    const normalized = normalizeSliceRect(rect, naturalWidth.value, naturalHeight.value)

    // Éviter les zones minuscules
    if (normalized.width < 8 || normalized.height < 8) {
      throw new Error('La zone de découpe est trop petite (minimum 8x8 px).')
    }

    const cat = category || defaultCategory.value
    const id = generateId('slice')
    const count = slices.value.length + 1
    const baseName = file.value ? file.value.name.replace(/\.[^/.]+$/, '') : 'sprite'
    const name = `${baseName}_${cat}_${String(count).padStart(2, '0')}`

    const newSlice: SpritesheetSlice = {
      id,
      name,
      category: cat,
      ...normalized
    }

    slices.value.push(newSlice)
    selectedSliceId.value = newSlice.id
    return newSlice
  }

  function updateSlice(sliceId: string, updates: Partial<SpritesheetSlice>) {
    const idx = slices.value.findIndex((s) => s.id === sliceId)
    if (idx !== -1) {
      slices.value[idx] = { ...slices.value[idx], ...updates }
    }
  }

  function removeSlice(sliceId: string) {
    slices.value = slices.value.filter((s) => s.id !== sliceId)
    if (selectedSliceId.value === sliceId) {
      selectedSliceId.value = slices.value.length > 0 ? slices.value[slices.value.length - 1].id : null
    }
  }

  function selectSlice(sliceId: string | null) {
    selectedSliceId.value = sliceId
  }

  /**
   * Extrait chaque rectangle découpé sous forme de Blob PNG indépendant via un Canvas HTML5
   */
  async function extractSlicesBlobs(): Promise<
    { blob: Blob; name: string; category: AssetCategory }[]
  > {
    const img = imageElement.value
    if (!img) {
      throw new Error('Image source de la planche non chargée.')
    }

    const results: { blob: Blob; name: string; category: AssetCategory }[] = []
    const offscreenCanvas = document.createElement('canvas')
    const ctx = offscreenCanvas.getContext('2d')

    if (!ctx) {
      throw new Error('Impossible de créer le contexte 2D pour la découpe.')
    }

    for (const slice of slices.value) {
      offscreenCanvas.width = slice.width
      offscreenCanvas.height = slice.height

      ctx.clearRect(0, 0, slice.width, slice.height)
      ctx.drawImage(
        img,
        slice.x,
        slice.y,
        slice.width,
        slice.height,
        0,
        0,
        slice.width,
        slice.height
      )

      const blob = await new Promise<Blob>((resolve, reject) => {
        offscreenCanvas.toBlob(
          (b) => {
            if (b) resolve(b)
            else reject(new Error(`Échec de génération du blob pour le sprite ${slice.name}`))
          },
          'image/png'
        )
      })

      results.push({
        blob,
        name: slice.name,
        category: slice.category
      })
    }

    return results
  }

  function reset() {
    if (imageSrc.value && imageSrc.value.startsWith('blob:')) {
      URL.revokeObjectURL(imageSrc.value)
    }
    file.value = null
    imageSrc.value = null
    imageElement.value = null
    naturalWidth.value = 0
    naturalHeight.value = 0
    slices.value = []
    selectedSliceId.value = null
    zoom.value = 1
  }

  return {
    file,
    imageSrc,
    imageElement,
    naturalWidth,
    naturalHeight,
    isImageLoading,
    slices,
    selectedSliceId,
    selectedSlice,
    defaultCategory,
    zoom,
    loadFile,
    addSlice,
    updateSlice,
    removeSlice,
    selectSlice,
    extractSlicesBlobs,
    reset
  }
}
