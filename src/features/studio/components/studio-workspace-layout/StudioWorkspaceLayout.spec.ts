import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import StudioWorkspaceLayout from './StudioWorkspaceLayout.vue'

describe('StudioWorkspaceLayout', () => {
  it('rend les régions dans un ordre de lecture classique', () => {
    const wrapper = mount(StudioWorkspaceLayout, {
      slots: {
        header: '<div>Header</div>',
        left: '<div>Bibliothèque</div>',
        default: '<div>Viewport</div>',
        right: '<div>Inspecteur</div>',
        footer: '<div>Contexte</div>'
      }
    })

    expect(
      wrapper
        .findAll('[data-layout-region]')
        .map((region) => region.attributes('data-layout-region'))
    ).toEqual(['header', 'compact-navigation', 'left', 'main', 'right', 'footer'])
  })

  it('protège la cellule centrale contre les débordements', () => {
    const wrapper = mount(StudioWorkspaceLayout, {
      slots: { default: '<div>Viewport</div>' }
    })

    const main = wrapper.get('[data-layout-region="main"]')
    expect(main.classes()).toContain('min-w-0')
    expect(main.classes()).toContain('min-h-0')
    expect(main.classes()).toContain('overflow-hidden')
    expect(wrapper.get('[data-testid="studio-workspace-layout"]').classes()).toContain('h-full')
    expect(wrapper.get('[data-testid="studio-workspace-layout"]').classes()).toContain('flex-1')
  })

  it('omet les régions optionnelles sans contenu', () => {
    const wrapper = mount(StudioWorkspaceLayout, {
      slots: { default: '<div>Viewport</div>' }
    })

    expect(wrapper.get('[data-layout-region="header"]').classes()).toContain('empty:hidden')
    expect(wrapper.find('[data-layout-region="left"]').exists()).toBe(false)
    expect(wrapper.find('[data-layout-region="right"]').exists()).toBe(false)
    expect(wrapper.get('[data-layout-region="footer"]').classes()).toContain('empty:hidden')
  })

  it('bascule entre les espaces compacts sans superposer les régions', async () => {
    const wrapper = mount(StudioWorkspaceLayout, {
      props: { compactPane: 'studio' },
      slots: {
        left: '<div>Bibliothèque</div>',
        default: '<div>Viewport</div>',
        right: '<div>Inspecteur</div>'
      }
    })

    const libraryButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Bibliothèque'))
    expect(libraryButton).toBeDefined()
    await libraryButton?.trigger('click')

    expect(wrapper.emitted('update:compactPane')?.at(-1)).toEqual(['library'])
    expect(wrapper.get('[data-layout-region="main"]').classes()).toContain('max-[1100px]:hidden')
    expect(wrapper.get('[data-layout-region="right"]').classes()).toContain('max-[1100px]:hidden')
  })
})
