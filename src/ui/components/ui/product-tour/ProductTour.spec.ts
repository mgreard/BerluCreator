import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductTour from './ProductTour.vue'

const driverMocks = vi.hoisted(() => ({
  drive: vi.fn(),
  destroy: vi.fn(),
  driver: vi.fn()
}))

vi.mock('driver.js', () => ({
  driver: driverMocks.driver
}))

describe('ProductTour', () => {
  beforeEach(() => {
    localStorage.clear()
    driverMocks.drive.mockReset()
    driverMocks.destroy.mockReset()
    driverMocks.driver.mockReset()
    driverMocks.driver.mockReturnValue({
      drive: driverMocks.drive,
      destroy: driverMocks.destroy
    })
  })

  it('exposes a start method that launches Driver.js', () => {
    const wrapper = mount(ProductTour, {
      props: {
        steps: [{ element: '#target', popover: { title: 'Cible' } }]
      }
    })

    ;(wrapper.vm as unknown as { start: () => void }).start()

    expect(driverMocks.driver).toHaveBeenCalledOnce()
    expect(driverMocks.drive).toHaveBeenCalledWith(0)
  })

  it('does not auto-start a tour already completed', () => {
    localStorage.setItem('tour.done', 'true')
    mount(ProductTour, {
      props: {
        steps: [],
        autoStart: true,
        startDelayMs: 0,
        storageKey: 'tour.done'
      }
    })

    expect(driverMocks.driver).not.toHaveBeenCalled()
  })
})
