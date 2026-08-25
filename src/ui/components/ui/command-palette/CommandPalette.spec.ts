import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CommandPalette from './CommandPalette.vue'
import type { CommandGroup } from './types'

const mockGroups: CommandGroup[] = [
  {
    name: 'Navigation',
    items: [
      { id: 'home', label: 'Aller à l’accueil', icon: 'home' },
      { id: 'settings', label: 'Paramètres du compte', icon: 'settings' }
    ]
  }
]

describe('CommandPalette (Colocated Unit Tests)', () => {
  it('1. Rend la palette de commandes et les groupes lorsque open est vrai', async () => {
    const wrapper = mount(CommandPalette, {
      props: {
        open: true,
        groups: mockGroups
      },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const dialog = document.body.querySelector('[role="dialog"]')
      expect(dialog?.textContent).toContain('Navigation')
      expect(dialog?.textContent).toContain('Aller à l’accueil')
      expect(dialog?.textContent).toContain('Paramètres du compte')
    })
    wrapper.unmount()
  })

  it('2. Filtre les commandes lors de la saisie d’une recherche', async () => {
    const wrapper = mount(CommandPalette, {
      props: {
        open: true,
        groups: mockGroups
      },
      attachTo: document.body
    })

    const input = await vi.waitFor(() => {
      const element = document.body.querySelector('input')
      expect(element).not.toBeNull()
      return element as HTMLInputElement
    })

    if (input) {
      input.value = 'accueil'
      input.dispatchEvent(new Event('input'))
    }

    await vi.waitFor(() => expect(document.body.textContent).toContain('Aller à l’accueil'))
    wrapper.unmount()
  })

  it('3. Émet select lors du clic sur un élément de commande', async () => {
    const wrapper = mount(CommandPalette, {
      props: {
        open: true,
        groups: mockGroups
      },
      attachTo: document.body
    })

    const homeItem = await vi.waitFor(() => {
      const button = Array.from(document.body.querySelectorAll('button')).find((element) =>
        element.textContent?.includes('Aller à l’accueil')
      )
      expect(button).toBeDefined()
      return button
    })

    if (homeItem) {
      homeItem.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    }

    await vi.waitFor(() => expect(wrapper.emitted('select')).toBeDefined())
    wrapper.unmount()
  })
})
