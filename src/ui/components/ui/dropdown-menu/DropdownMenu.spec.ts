import { afterEach, describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DropdownMenu from './DropdownMenu.vue'
import type { DropdownMenuItemDef } from './types'

const mockItems: DropdownMenuItemDef[] = [
  { id: 'edit', label: 'Modifier', icon: 'edit' },
  { type: 'separator' },
  { id: 'delete', label: 'Supprimer', icon: 'delete', destructive: true }
]

afterEach(() => {
  document.querySelectorAll('[data-test-portal]').forEach((element) => element.remove())
})

describe('DropdownMenu (Colocated Unit Tests)', () => {
  it('1. Rend le déclencheur et les éléments de menu lorsque open est vrai', async () => {
    const wrapper = mount(DropdownMenu, {
      props: {
        open: true,
        items: mockItems
      },
      slots: {
        trigger: '<button class="trigger-btn">Menu</button>'
      },
      attachTo: document.body
    })

    expect(wrapper.find('.trigger-btn').exists()).toBe(true)
    await vi.waitFor(() => {
      const menu = document.body.querySelector('[role="menu"]')
      expect(menu?.textContent).toContain('Modifier')
      expect(menu?.textContent).toContain('Supprimer')
    })
    wrapper.unmount()
  })

  it('2. Émet select lors du clic sur un élément de menu', async () => {
    const wrapper = mount(DropdownMenu, {
      props: {
        open: true,
        items: mockItems
      },
      slots: {
        trigger: '<button>Menu</button>'
      },
      attachTo: document.body
    })

    const itemEdit = await vi.waitFor(() => {
      const item = Array.from(document.body.querySelectorAll('[role="menuitem"]')).find((element) =>
        element.textContent?.includes('Modifier')
      )
      expect(item).toBeDefined()
      return item
    })

    if (itemEdit) {
      itemEdit.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    }

    await vi.waitFor(() => expect(wrapper.emitted('select')).toBeDefined())
    wrapper.unmount()
  })

  it('3. Utilise une surface opaque par défaut et conserve glass en opt-in', async () => {
    const solidWrapper = mount(DropdownMenu, {
      props: { open: true, items: mockItems },
      slots: { trigger: '<button>Menu solide</button>' },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const menu = document.body.querySelector('[role="menu"]')
      expect(menu?.classList.contains('bg-bg-elevated')).toBe(true)
      expect(menu?.classList.contains('glass-premium')).toBe(false)
    })
    solidWrapper.unmount()

    const glassWrapper = mount(DropdownMenu, {
      props: { open: true, items: mockItems, surface: 'glass' },
      slots: { trigger: '<button>Menu vitré</button>' },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      expect(
        document.body.querySelector('[role="menu"]')?.classList.contains('glass-premium')
      ).toBe(true)
    })
    glassWrapper.unmount()
  })

  it('4. Téléporte vers une cible dédiée et transmet les attributs au menu', async () => {
    const portalTarget = document.createElement('div')
    portalTarget.id = 'dropdown-test-portal'
    portalTarget.dataset.testPortal = 'true'
    document.body.appendChild(portalTarget)

    const wrapper = mount(DropdownMenu, {
      props: {
        open: true,
        items: mockItems,
        portalTo: '#dropdown-test-portal',
        positionStrategy: 'fixed'
      },
      attrs: {
        'aria-label': 'Actions téléportées',
        'data-testid': 'teleported-menu'
      },
      slots: {
        trigger: '<button>Menu téléporté</button>'
      },
      attachTo: document.body
    })

    await vi.waitFor(() => {
      const menu = portalTarget.querySelector('[data-testid="teleported-menu"]')
      expect(menu?.getAttribute('aria-label')).toBe('Actions téléportées')
      expect(menu?.textContent).toContain('Modifier')
      expect(
        (portalTarget.querySelector('[data-reka-popper-content-wrapper]') as HTMLElement | null)
          ?.style.position
      ).toBe('fixed')
    })

    wrapper.unmount()
  })

  it('5. Émet une seule sélection avec le nouvel état d’une checkbox', async () => {
    const checkboxItem: DropdownMenuItemDef = {
      id: 'snap',
      label: 'Magnétisme',
      type: 'checkbox',
      checked: false
    }
    const wrapper = mount(DropdownMenu, {
      props: { open: true, items: [checkboxItem] },
      slots: { trigger: '<button>Options</button>' },
      attachTo: document.body
    })

    const checkbox = await vi.waitFor(() => {
      const element = document.body.querySelector('[role="menuitemcheckbox"]') as HTMLElement | null
      expect(element).not.toBeNull()
      return element
    })
    checkbox?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    await vi.waitFor(() => {
      const selections = wrapper.emitted('select')
      expect(selections).toHaveLength(1)
      expect(selections?.[0]?.[0]).toMatchObject({ id: 'snap', checked: true })
    })
    wrapper.unmount()
  })
})
