import { afterEach, describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Popover from './Popover.vue'
import { guardPopoverOutsideInteraction } from './outside-interaction'

afterEach(() => {
  document.querySelectorAll('[data-test-portal]').forEach((element) => element.remove())
})

describe('Popover (Colocated Unit Tests)', () => {
  it('1. Rend le contenu du popover lorsque modelValue est vrai', async () => {
    const wrapper = mount(Popover, {
      props: {
        modelValue: true,
        title: 'Détails du profil',
        description: 'Informations complémentaires'
      },
      slots: {
        default: '<div class="popover-body">Détails utilisateur</div>'
      },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const content = document.body.querySelector('[data-reka-popper-content-wrapper]')
      expect(content?.textContent).toContain('Détails du profil')
      expect(content?.textContent).toContain('Informations complémentaires')
      expect(content?.textContent).toContain('Détails utilisateur')
    })
    wrapper.unmount()
  })

  it('2. Rend le déclencheur et le pied du popover', async () => {
    const wrapper = mount(Popover, {
      props: {
        modelValue: true
      },
      slots: {
        trigger: '<button class="btn-pop">Ouvrir</button>',
        default: 'Contenu',
        footer: '<div class="footer-actions">Action</div>'
      },
      attachTo: document.body
    })

    expect(wrapper.find('.btn-pop').exists()).toBe(true)
    await vi.waitFor(() => expect(document.body.querySelector('.footer-actions')).not.toBeNull())
    wrapper.unmount()
  })

  it('3. Utilise une surface opaque par défaut et conserve glass en opt-in', async () => {
    const solidWrapper = mount(Popover, {
      props: { modelValue: true, title: 'Surface solide' },
      slots: { default: 'Contenu' },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const content = document.body.querySelector('[data-reka-popper-content-wrapper] > div')
      expect(content?.classList.contains('bg-bg-elevated')).toBe(true)
      expect(content?.classList.contains('viewport-glass')).toBe(false)
    })
    solidWrapper.unmount()

    const glassWrapper = mount(Popover, {
      props: { modelValue: true, title: 'Surface vitrée', surface: 'glass' },
      slots: { default: 'Contenu' },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const content = document.body.querySelector('[data-reka-popper-content-wrapper] > div')
      expect(content?.classList.contains('viewport-glass')).toBe(true)
    })
    glassWrapper.unmount()
  })

  it('4. Téléporte vers une cible dédiée et transmet les attributs au contenu positionné', async () => {
    const portalTarget = document.createElement('div')
    portalTarget.id = 'popover-test-portal'
    portalTarget.dataset.testPortal = 'true'
    document.body.appendChild(portalTarget)

    const wrapper = mount(Popover, {
      props: {
        modelValue: true,
        portalTo: '#popover-test-portal',
        bodyClass: 'custom-popover-body',
        positionStrategy: 'fixed'
      },
      attrs: {
        'aria-label': 'Réglages téléportés',
        'data-testid': 'teleported-popover'
      },
      slots: {
        default: 'Contenu téléporté'
      },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const content = portalTarget.querySelector('[data-testid="teleported-popover"]')
      expect(content?.getAttribute('aria-label')).toBe('Réglages téléportés')
      expect(content?.textContent).toContain('Contenu téléporté')
      expect(portalTarget.querySelector('.custom-popover-body')).not.toBeNull()
      expect(
        (portalTarget.querySelector('[data-reka-popper-content-wrapper]') as HTMLElement | null)
          ?.style.position
      ).toBe('fixed')
    })

    wrapper.unmount()
  })

  it('5. Ignore le dismissal pour une zone extérieure explicitement autorisée', () => {
    const protectedZone = document.createElement('div')
    protectedZone.dataset.depthOverlay = ''
    document.body.appendChild(protectedZone)

    const originalEvent = new Event('pointerdown')
    Object.defineProperty(originalEvent, 'target', { value: protectedZone })
    const outsideEvent = new CustomEvent('pointerDownOutside', {
      cancelable: true,
      detail: { originalEvent }
    })

    const guarded = guardPopoverOutsideInteraction(outsideEvent, '[data-depth-overlay]')

    expect(guarded).toBe(true)
    expect(outsideEvent.defaultPrevented).toBe(true)
    protectedZone.remove()
  })

  it('6. Reste ouvert jusqu’au clic sur la croix en mode persistant', async () => {
    const onUpdateModelValue = vi.fn()
    const wrapper = mount(Popover, {
      props: {
        modelValue: true,
        title: 'Réglages persistants',
        closeOnCloseButtonOnly: true,
        'onUpdate:modelValue': onUpdateModelValue
      },
      slots: {
        trigger: '<button class="persistent-trigger">Réglages</button>',
        default: 'Contenu persistant'
      },
      attachTo: document.body
    })

    const root = wrapper.findComponent({ name: 'PopoverRoot' })
    root.vm.$emit('update:open', false)
    await wrapper.vm.$nextTick()

    expect(onUpdateModelValue).not.toHaveBeenCalled()
    expect(wrapper.emitted('close')).toBeUndefined()

    const closeButton = document.body.querySelector<HTMLButtonElement>(
      '[data-reka-popper-content-wrapper] button[aria-label="Fermer"]'
    )
    expect(closeButton).not.toBeNull()
    closeButton?.click()
    await wrapper.vm.$nextTick()

    expect(onUpdateModelValue).toHaveBeenCalledTimes(1)
    expect(onUpdateModelValue).toHaveBeenLastCalledWith(false)
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })
})
