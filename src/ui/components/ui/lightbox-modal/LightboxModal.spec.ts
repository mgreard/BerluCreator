import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LightboxModal from './LightboxModal.vue'

describe('LightboxModal (Colocated Unit Tests)', () => {
  it('1. Rend l’image plein écran et la légende', async () => {
    const wrapper = mount(LightboxModal, {
      props: {
        imageUrl: 'https://example.com/photo.jpg',
        altText: 'Vue panoramique',
        caption: 'Coucher de soleil sur les montagnes'
      },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const dialog = document.body.querySelector('[role="dialog"]')
      const img = dialog?.querySelector('img')
      expect(img?.src).toBe('https://example.com/photo.jpg')
      expect(img?.alt).toBe('Vue panoramique')
      expect(dialog?.textContent).toContain('Coucher de soleil sur les montagnes')
    })
    wrapper.unmount()
  })

  it('2. Émet close lors du clic sur le bouton de fermeture', async () => {
    const wrapper = mount(LightboxModal, {
      props: {
        imageUrl: 'https://example.com/photo.jpg'
      },
      attachTo: document.body
    })

    const closeBtn = await vi.waitFor(() => {
      const button = document.body.querySelector('button[aria-label="Fermer la modal"]')
      expect(button).not.toBeNull()
      return button
    })

    if (closeBtn) {
      closeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    }

    await vi.waitFor(() => {
      expect(wrapper.emitted('close')).toBeDefined()
      expect(wrapper.emitted('update:open')).toEqual([[false]])
    })
    wrapper.unmount()
  })

  it('3. Applique le niveau d’empilement aux deux couches', async () => {
    const wrapper = mount(LightboxModal, {
      props: {
        imageUrl: 'https://example.com/photo.jpg',
        zIndex: 1050
      },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const dialog = document.body.querySelector<HTMLElement>('[role="dialog"]')
      const overlay = dialog?.previousElementSibling as HTMLElement | null
      expect(dialog?.style.zIndex).toBe('1050')
      expect(overlay?.style.zIndex).toBe('1050')
    })
    wrapper.unmount()
  })

  it('4. Place le focus dans la visionneuse et le restitue au déclencheur', async () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'Agrandir l’image'
    document.body.appendChild(trigger)
    trigger.focus()

    const wrapper = mount(LightboxModal, {
      props: { imageUrl: 'https://example.com/photo.jpg' },
      attachTo: document.body
    })

    const closeButton = await vi.waitFor(() => {
      const button = document.body.querySelector<HTMLButtonElement>(
        'button[aria-label="Fermer la modal"]'
      )
      expect(button).not.toBeNull()
      expect(document.activeElement).toBe(button)
      return button!
    })

    closeButton.click()
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger))

    wrapper.unmount()
    trigger.remove()
  })
})
