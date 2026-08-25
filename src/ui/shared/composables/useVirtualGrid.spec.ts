import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useVirtualGrid } from './useVirtualGrid'

describe('useVirtualGrid', () => {
  it('calcule la hauteur totale et découpe les éléments visibles', () => {
    const mockItems = ref(Array.from({ length: 50 }, (_, i) => ({ id: `item-${i}` })))
    const itemHeight = ref(100)
    const columns = ref(1)

    const { visibleItems, totalHeight, offsetY } = useVirtualGrid(mockItems, {
      itemHeight,
      columns,
      overscan: 1
    })

    expect(totalHeight.value).toBe(5000)
    expect(offsetY.value).toBe(0)
    expect(visibleItems.value.length).toBeGreaterThan(0)
    expect(visibleItems.value[0].item.id).toBe('item-0')
  })

  it('prend en compte le nombre de colonnes pour les grilles', () => {
    const mockItems = ref(Array.from({ length: 20 }, (_, i) => ({ id: `item-${i}` })))
    const itemHeight = ref(200)
    const columns = ref(4)

    const { totalHeight } = useVirtualGrid(mockItems, {
      itemHeight,
      columns
    })

    // 20 éléments sur 4 colonnes = 5 lignes de 200px = 1000px
    expect(totalHeight.value).toBe(1000)
  })
})
