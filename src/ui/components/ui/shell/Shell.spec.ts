import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Shell from './Shell.vue'

describe('Shell (Colocated Unit Tests)', () => {
  it('1. Rend le shell avec marque et navigation principale', () => {
    const wrapper = mount(Shell, {
      props: {
        brandTitle: 'MyCompLib Admin',
        brandIcon: 'diamond'
      },
      slots: {
        sidebar: '<nav class="nav-links">Liens de nav</nav>',
        default: '<div class="page-content">Contenu page</div>'
      }
    })

    expect(wrapper.text()).toContain('MyCompLib Admin')
    expect(wrapper.text()).toContain('Liens de nav')
    expect(wrapper.text()).toContain('Contenu page')
  })

  it('2. Bascule sidebarOpen lors du clic sur le bouton de repliage', async () => {
    const wrapper = mount(Shell, {
      props: {
        sidebarOpen: true,
        collapsible: true
      }
    })

    const toggleBtn = wrapper.find('button[aria-label="Replier le menu"]')
    expect(toggleBtn.exists()).toBe(true)

    await toggleBtn.trigger('click')
    expect(wrapper.emitted('update:sidebarOpen')?.[0]).toEqual([false])
    expect(wrapper.emitted('toggle-sidebar')?.[0]).toEqual([false])
  })
})
