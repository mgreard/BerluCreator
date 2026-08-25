import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AlertDialog from './AlertDialog.vue'

describe('AlertDialog (Colocated Unit Tests)', () => {
  it('1. Rend le dialogue d’alerte avec titre et description', async () => {
    const wrapper = mount(AlertDialog, {
      props: {
        open: true,
        title: 'Supprimer ce projet ?',
        description: 'Toutes les données associées seront perdues.'
      },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const dialog = document.body.querySelector('[role="alertdialog"]')
      expect(dialog?.textContent).toContain('Supprimer ce projet ?')
      expect(dialog?.textContent).toContain('Toutes les données associées seront perdues.')
      expect(dialog?.getAttribute('data-surface')).toBe('solid')
      expect(dialog?.classList.contains('bg-bg-elevated')).toBe(true)
    })
    wrapper.unmount()
  })

  it('2. Émet confirm lors du clic sur le bouton de confirmation', async () => {
    const wrapper = mount(AlertDialog, {
      props: {
        open: true,
        title: 'Confirmation',
        confirmText: 'Oui, continuer'
      },
      attachTo: document.body
    })

    const confirmBtn = await vi.waitFor(() => {
      const button = Array.from(document.body.querySelectorAll('button')).find((element) =>
        element.textContent?.includes('Oui, continuer')
      )
      expect(button).toBeDefined()
      return button
    })

    if (confirmBtn) {
      confirmBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    }

    await vi.waitFor(() => expect(wrapper.emitted('confirm')).toHaveLength(1))
    wrapper.unmount()
  })

  it('3. Bloque la confirmation si requireConfirmationText est requis et non saisi', async () => {
    const wrapper = mount(AlertDialog, {
      props: {
        open: true,
        title: 'Action critique',
        requireConfirmationText: 'DELETE'
      },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const dialog = document.body.querySelector('[role="alertdialog"]')
      const confirmBtn = Array.from(document.body.querySelectorAll('button')).find((element) =>
        element.textContent?.includes('Confirmer')
      )
      expect(dialog?.textContent).toContain('DELETE')
      expect(confirmBtn?.hasAttribute('disabled')).toBe(true)
    })

    wrapper.unmount()
  })
})
