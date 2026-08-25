import {
  ref,
  computed,
  toValue,
  watch,
  onMounted,
  onUnmounted,
  getCurrentInstance,
  type Ref,
  type MaybeRef
} from 'vue'

export interface VirtualGridItem<T> {
  item: T
  originalIndex: number
}

export interface VirtualGridOptions {
  itemHeight: MaybeRef<number>
  columns?: MaybeRef<number>
  overscan?: number
  containerRef?: Ref<HTMLElement | null>
}

export type UseVirtualGridOptions = VirtualGridOptions

export function useVirtualGrid<T>(items: MaybeRef<T[]>, options: VirtualGridOptions) {
  const itemHeightRef = computed(() => toValue(options.itemHeight))
  const columnsRef = computed(() => {
    const rawCols = options.columns !== undefined ? toValue(options.columns) : 1
    return Math.max(1, rawCols)
  })

  const containerRef = options.containerRef ?? ref<HTMLElement | null>(null)
  const overscan = options.overscan ?? 2
  const scrollTop = ref(0)
  const viewportHeight = ref(800)

  let rAFId: number | null = null

  function readMetrics() {
    const el = containerRef.value
    if (el) {
      scrollTop.value = el.scrollTop
      viewportHeight.value = el.clientHeight
    } else if (typeof window !== 'undefined') {
      scrollTop.value = window.scrollY || document.documentElement.scrollTop || 0
      viewportHeight.value = window.innerHeight
    }
  }

  function updateMetrics() {
    if (typeof window === 'undefined') {
      readMetrics()
      return
    }
    if (rAFId !== null) return
    rAFId = window.requestAnimationFrame(() => {
      readMetrics()
      rAFId = null
    })
  }

  if (getCurrentInstance()) {
    let cleanupCurrentListener: (() => void) | null = null

    function bindListeners(el: HTMLElement | null) {
      if (cleanupCurrentListener) {
        cleanupCurrentListener()
        cleanupCurrentListener = null
      }

      readMetrics()

      if (el) {
        el.addEventListener('scroll', updateMetrics, { passive: true })
        cleanupCurrentListener = () => {
          el.removeEventListener('scroll', updateMetrics)
        }
      } else if (typeof window !== 'undefined') {
        window.addEventListener('scroll', updateMetrics, { passive: true })
        window.addEventListener('resize', updateMetrics, { passive: true })
        cleanupCurrentListener = () => {
          window.removeEventListener('scroll', updateMetrics)
          window.removeEventListener('resize', updateMetrics)
        }
      }
    }

    watch(
      () => containerRef.value,
      (newEl) => {
        bindListeners(newEl)
      },
      { flush: 'post' }
    )

    onMounted(() => {
      bindListeners(containerRef.value)
    })

    onUnmounted(() => {
      if (cleanupCurrentListener) {
        cleanupCurrentListener()
        cleanupCurrentListener = null
      }
      if (rAFId !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(rAFId)
        rAFId = null
      }
    })
  }

  const totalRows = computed(() => {
    return Math.ceil(toValue(items).length / columnsRef.value)
  })

  const totalHeight = computed(() => {
    return totalRows.value * itemHeightRef.value
  })

  const startRow = computed(() => {
    const itemHeight = itemHeightRef.value || 1
    const row = Math.floor(scrollTop.value / itemHeight) - overscan
    return Math.max(0, row)
  })

  const endRow = computed(() => {
    const itemHeight = itemHeightRef.value || 1
    const height = viewportHeight.value || 800
    const row = Math.ceil((scrollTop.value + height) / itemHeight) + overscan
    return Math.min(totalRows.value, row)
  })

  const startIndex = computed(() => {
    return startRow.value * columnsRef.value
  })

  const endIndex = computed(() => {
    return Math.min(toValue(items).length, endRow.value * columnsRef.value)
  })

  const visibleItems = computed<VirtualGridItem<T>[]>(() => {
    const list = toValue(items)
    return list.slice(startIndex.value, endIndex.value).map((item, idx) => ({
      item,
      originalIndex: startIndex.value + idx
    }))
  })

  const offsetY = computed(() => {
    return startRow.value * itemHeightRef.value
  })

  return {
    containerRef,
    visibleItems,
    viewportItems: visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    updateMetrics
  }
}
