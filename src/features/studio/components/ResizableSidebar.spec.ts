import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ResizableSidebar from './ResizableSidebar.vue'

describe('ResizableSidebar', () => {
  it('se redimensionne au clavier depuis sa poignée accessible', async () => {
    const wrapper = mount(ResizableSidebar, {
      props: { side: 'left', defaultWidth: 320, open: true },
      slots: { default: '<div>Contenu</div>' }
    })

    const separator = wrapper.get('[role="separator"]')
    await separator.trigger('keydown', { key: 'ArrowRight' })

    expect(wrapper.get('aside').attributes('style')).toContain('width: 336px')
    expect(separator.attributes('aria-valuenow')).toBe('336')
  })

  it('conserve un rail de réouverture lorsqu’il est replié', async () => {
    const wrapper = mount(ResizableSidebar, {
      props: { side: 'right', defaultWidth: 320, open: true }
    })

    await wrapper.setProps({ open: false })

    expect(wrapper.get('aside').attributes('style')).toContain('width: 40px')
    expect(wrapper.find('[role="separator"]').exists()).toBe(false)
    expect(wrapper.get('button').attributes('aria-label')).toContain('Déplier')
  })
})
