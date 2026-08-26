import { afterEach, describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ToastContainer from './ToastContainer.vue'
import { toast, activeToasts } from '@/shared/services/toast.service'

describe('ToastContainer (Colocated Unit Tests)', () => {
  afterEach(() => {
    activeToasts.value = []
  })

  it('1. Rend le conteneur avec aria-live="polite" et aria-atomic="true"', async () => {
    const wrapper = mount(ToastContainer, {
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const container = document.body.querySelector('[aria-live="polite"]')
      expect(container).not.toBeNull()
      expect(container?.getAttribute('aria-atomic')).toBe('true')
    })
    wrapper.unmount()
  })

  it('2. Affiche les notifications toast créées via le service', async () => {
    const wrapper = mount(ToastContainer, {
      attachTo: document.body
    })

    toast.success('Opération réussie', 'Votre projet a été sauvegardé.')
    await wrapper.vm.$nextTick()

    expect(document.body.innerHTML).toContain('Opération réussie')
    expect(document.body.innerHTML).toContain('Votre projet a été sauvegardé.')

    wrapper.unmount()
  })

  it('3. Reste au-dessus des dialogues et permet de fermer une notification', async () => {
    const wrapper = mount(ToastContainer, {
      props: { zIndex: 10050 },
      attachTo: document.body
    })

    toast.warning('Attention', 'Vérifiez les données.', 0)
    await wrapper.vm.$nextTick()

    const container = document.body.querySelector<HTMLElement>('[aria-live="polite"]')
    const closeButton = document.body.querySelector<HTMLButtonElement>(
      'button[aria-label="Fermer la notification"]'
    )

    expect(container?.style.zIndex).toBe('10050')
    expect(closeButton).not.toBeNull()

    closeButton?.click()
    await wrapper.vm.$nextTick()
    expect(activeToasts.value).toHaveLength(0)

    wrapper.unmount()
  })

  it('4. Arrête la propagation des clics pour ne pas fermer une modale active', async () => {
    const wrapper = mount(ToastContainer, { attachTo: document.body })
    const parentClick = vi.fn()
    document.body.addEventListener('click', parentClick, { once: true })
    toast.info('Information', 'Action terminée.', 0)
    await wrapper.vm.$nextTick()

    document.body.querySelector<HTMLElement>('[role="alert"]')?.click()

    expect(parentClick).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
