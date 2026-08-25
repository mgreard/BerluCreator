import { enableAutoUnmount } from '@vue/test-utils'
import { afterEach, vi } from 'vitest'

class ResizeObserverMock implements ResizeObserver {
  disconnect() {}

  observe() {}

  unobserve() {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  writable: true,
  value: ResizeObserverMock
})

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  configurable: true,
  writable: true,
  value: vi.fn()
})

Object.defineProperty(URL, 'createObjectURL', {
  configurable: true,
  writable: true,
  value: vi.fn(() => 'blob:vitest')
})

Object.defineProperty(URL, 'revokeObjectURL', {
  configurable: true,
  writable: true,
  value: vi.fn()
})

Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
  configurable: true,
  writable: true,
  value: vi.fn()
})

afterEach(() => {
  vi.clearAllMocks()
  document.body.replaceChildren()
})

enableAutoUnmount(afterEach)
