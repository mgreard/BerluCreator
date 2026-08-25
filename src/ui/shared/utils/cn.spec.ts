import { describe, it, expect } from 'vitest'
import { cn } from './cn'

describe('cn utility', () => {
  it('combines simple class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('handles conditional class names', () => {
    const isHidden = false
    const isActive = true
    expect(cn('base-class', isActive && 'text-blue-500', isHidden && 'hidden')).toBe(
      'base-class text-blue-500'
    )
  })

  it('merges overlapping Tailwind classes correctly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    expect(cn('bg-red-500', 'hover:bg-red-600', 'bg-blue-500')).toBe('hover:bg-red-600 bg-blue-500')
  })

  it('preserves semantic typography utilities alongside color utilities', () => {
    expect(cn('text-display-hero', 'text-text-primary')).toBe('text-display-hero text-text-primary')
    expect(cn('text-display-hero', 'text-title-page')).toBe('text-title-page')
  })

  it('handles arrays and objects', () => {
    expect(cn(['flex', 'items-center'], { 'gap-2': true, 'gap-4': false })).toBe(
      'flex items-center gap-2'
    )
  })
})
