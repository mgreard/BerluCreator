import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Avatar from './Avatar.vue'

describe('Avatar (Colocated Unit Tests)', () => {
  it('1. Dérive automatiquement les initiales depuis la prop name', async () => {
    const wrapper = mount(Avatar, {
      props: {
        name: 'Marie Curie'
      }
    })

    await vi.waitFor(() => expect(wrapper.text()).toContain('MC'))
  })

  it('2. Utilise le fallback explicite lorsqu’il est fourni', async () => {
    const wrapper = mount(Avatar, {
      props: {
        name: 'Marie Curie',
        fallback: 'DOC'
      }
    })

    await vi.waitFor(() => expect(wrapper.text()).toContain('DOC'))
  })

  it('3. Affiche l’icône générique de fallback en l’absence de nom et de fallback', async () => {
    const wrapper = mount(Avatar)
    await vi.waitFor(() => expect(wrapper.text()).toContain('👤'))
  })

  it('4. Affiche la pastille de statut avec l’aria-label approprié', () => {
    const wrapper = mount(Avatar, {
      props: {
        name: 'Ada Lovelace',
        status: 'online'
      }
    })

    const statusBadge = wrapper.find('[role="status"]')
    expect(statusBadge.exists()).toBe(true)
    expect(statusBadge.attributes('aria-label')).toBe('Statut : online')
    expect(statusBadge.classes()).toContain('bg-success')
  })

  it('5. Configure l’accessibilité et la hitbox Fitts 44px lorsque clickable est vrai', async () => {
    const wrapper = mount(Avatar, {
      props: {
        name: 'Alan Turing',
        size: 'xs',
        clickable: true
      }
    })

    const avatarRoot = wrapper.find('[role="button"]')
    expect(avatarRoot.exists()).toBe(true)
    expect(avatarRoot.attributes('tabindex')).toBe('0')
    expect(avatarRoot.classes()).toContain('cursor-pointer')
    expect(avatarRoot.classes().join(' ')).toContain('after:min-w-[44px]')

    await avatarRoot.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)

    await avatarRoot.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('click')).toHaveLength(2)

    await avatarRoot.trigger('keydown', { key: ' ' })
    expect(wrapper.emitted('click')).toHaveLength(3)
  })

  it('6. Applique les formes et variantes visuelles', () => {
    const wrapper = mount(Avatar, {
      props: {
        shape: 'rounded',
        variant: 'glass'
      }
    })

    const avatarRoot = wrapper.find('.rounded-2xl')
    expect(avatarRoot.exists()).toBe(true)
    expect(avatarRoot.classes()).toContain('glass')
  })
})
