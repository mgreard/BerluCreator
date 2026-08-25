import { describe, it, expect } from 'vitest'
import { resolveChildPosition } from './transform-matrix'
import type { AnchorPoint } from '@core/types/asset.types'

describe('resolveChildPosition', () => {
  it('should compute child position matching parent socket and child mount', () => {
    const parentPos = { x: 100, y: 200 }

    // Le parent a un socket (ex: cou sur le torse à x:50, y:20)
    const parentSocket: AnchorPoint = {
      id: 's1',
      name: 'neck',
      type: 'socket',
      x: 50,
      y: 20
    }

    // L'enfant a un mount (ex: base de la tête à x:40, y:90)
    const childMount: AnchorPoint = {
      id: 'm1',
      name: 'neck',
      type: 'mount',
      x: 40,
      y: 90
    }

    const childPos = resolveChildPosition(parentPos, parentSocket, childMount)

    // X = 100 + 50 - 40 = 110
    // Y = 200 + 20 - 90 = 130
    expect(childPos.x).toBe(110)
    expect(childPos.y).toBe(130)
  })

  it('should fallback to parent position if socket or mount is missing', () => {
    const parentPos = { x: 100, y: 200 }
    const childPos = resolveChildPosition(parentPos, undefined, undefined)

    expect(childPos.x).toBe(100)
    expect(childPos.y).toBe(200)
  })
})
