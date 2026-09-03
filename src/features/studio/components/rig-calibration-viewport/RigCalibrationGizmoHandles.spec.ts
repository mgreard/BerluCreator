import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { AnchoredAssetCalibration } from '@core/types/asset.types'
import type { HeadSeriesProfile } from '../../rig-calibration/rig-catalog.types'
import RigCalibrationGizmoAccessory from './RigCalibrationGizmoAccessory.vue'
import RigCalibrationGizmoAnchors from './RigCalibrationGizmoAnchors.vue'
import RigCalibrationGizmoHead from './RigCalibrationGizmoHead.vue'

function expectTouchTargetClasses(element: Element): void {
  expect(element.classList.contains('h-12')).toBe(true)
  expect(element.classList.contains('w-12')).toBe(true)
  expect(element.classList.contains('sm:h-11')).toBe(true)
  expect(element.classList.contains('sm:w-11')).toBe(true)
  expect(element.classList.contains('touch-none')).toBe(true)
}

describe('poignées tactiles du calibreur', () => {
  it('conserve les poignées de tête à une taille tactile malgré le zoom du sprite', () => {
    const wrapper = mount(RigCalibrationGizmoHead, {
      props: {
        x: 100,
        y: 80,
        width: 400,
        height: 500,
        scale: 0.25,
        zoom: 0.5
      }
    })

    const resizeHandles = wrapper.findAll('[data-testid="head-resize-handle"]')
    expect(resizeHandles).toHaveLength(4)
    for (const handle of resizeHandles) {
      expectTouchTargetClasses(handle.element)
      expect(handle.attributes('style')).toContain('translate(-400%, -400%)')
      expect(handle.attributes('style')).toContain('scale(8)')
      expect(handle.attributes('style')).toContain('transform-origin: top left')
    }

    const rotationHandle = wrapper.get('[data-testid="head-rotation-handle"]')
    expectTouchTargetClasses(rotationHandle.element)
    expect(rotationHandle.attributes('style')).toContain('top: -352px')
    expect(rotationHandle.attributes('style')).toContain('scale(8)')
    expect(wrapper.get('[data-testid="head-rotation-marker"]').classes()).toEqual(
      expect.arrayContaining(['h-7', 'w-7', 'sm:h-6', 'sm:w-6'])
    )
    for (const marker of wrapper.findAll('[data-testid="head-resize-marker"]')) {
      expect(marker.classes()).toEqual(
        expect.arrayContaining(['h-5', 'w-5', 'sm:h-4', 'sm:w-4'])
      )
    }
  })

  it('contre-redimensionne aussi les poignées de taille et rotation des accessoires', () => {
    const calibration: AnchoredAssetCalibration = {
      pivot: { x: 0.5, y: 0.5 },
      offsetX: 0,
      offsetY: 0,
      scale: 0.5,
      rotation: 0
    }
    const wrapper = mount(RigCalibrationGizmoAccessory, {
      props: {
        anchor: { x: 0.5, y: 0.4 },
        headWidth: 400,
        headHeight: 500,
        calibration,
        assetWidth: 200,
        assetHeight: 100,
        zoom: 0.5,
        headScale: 0.25,
        pivotStageX: 300,
        pivotStageY: 240
      }
    })

    const handles = wrapper.findAll(
      '[data-testid="accessory-resize-handle"], [data-testid="accessory-rotation-handle"]'
    )
    expect(handles).toHaveLength(3)
    for (const handle of handles) {
      expectTouchTargetClasses(handle.element)
      expect(handle.attributes('style')).toContain('translate(-800%, -800%)')
      expect(handle.attributes('style')).toContain('scale(16)')
      expect(handle.attributes('style')).toContain('transform-origin: top left')
    }
    expect(wrapper.get('[data-testid="accessory-rotation-handle"]').attributes('style')).toContain(
      'top: -704px'
    )
    expect(wrapper.get('[data-testid="accessory-rotation-marker"]').classes()).toEqual(
      expect.arrayContaining(['h-7', 'w-7', 'sm:h-6', 'sm:w-6'])
    )
    for (const marker of wrapper.findAll('[data-testid="accessory-resize-marker"]')) {
      expect(marker.classes()).toEqual(
        expect.arrayContaining(['h-5', 'w-5', 'sm:h-4', 'sm:w-4'])
      )
    }
  })

  it('donne la priorité au drag du point d’ancrage même sur une tête réduite', async () => {
    const series: HeadSeriesProfile = {
      id: 'berlu',
      label: 'Berlu',
      width: 400,
      height: 500,
      neckPivot: { x: 0.5, y: 0.9 },
      mouthAnchor: { x: 0.5, y: 0.55 },
      propAnchors: {
        sunglass: { x: 0.5, y: 0.4 },
        hat: { x: 0.5, y: 0.1 }
      },
      updatedAt: 1
    }
    const wrapper = mount(RigCalibrationGizmoAnchors, {
      props: {
        series,
        headWidth: 400,
        headHeight: 500,
        headScale: 0.25,
        zoom: 0.5
      }
    })
    const neckHandle = wrapper.get('[data-testid="anchor-handle-neckPivot"]')

    expectTouchTargetClasses(neckHandle.element)
    expect(neckHandle.attributes('style')).toContain('translate(-400%, -400%)')
    expect(neckHandle.attributes('style')).toContain('scale(8)')
    expect(wrapper.get('[data-testid="anchor-marker-neckPivot"]').classes()).toEqual(
      expect.arrayContaining(['h-6', 'w-6', 'sm:h-5', 'sm:w-5'])
    )

    await neckHandle.trigger('pointerdown', { pointerId: 1, clientX: 100, clientY: 100 })
    await neckHandle.trigger('pointermove', { pointerId: 1, clientX: 110, clientY: 100 })

    expect(wrapper.emitted('select:anchor')?.[0]).toEqual(['neckPivot'])
    expect(wrapper.emitted('drag-start')).toHaveLength(1)
    expect(wrapper.emitted('update:anchor')?.[0]?.[0]).toMatchObject({
      anchor: 'neckPivot'
    })
  })
})
