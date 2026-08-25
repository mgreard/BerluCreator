import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import AvatarGroup from './AvatarGroup.vue'
import { Avatar } from '@/components/ui/avatar'

describe('AvatarGroup (Colocated Unit Tests)', () => {
  it('1. Rend le groupe avec le rôle group et l’aria-label', () => {
    const wrapper = mount(AvatarGroup, {
      props: {
        ariaLabel: 'Membres de l’équipe'
      },
      slots: {
        default: '<div class="avatar-item">Avatar 1</div>'
      }
    })

    expect(wrapper.attributes('role')).toBe('group')
    expect(wrapper.attributes('aria-label')).toBe('Membres de l’équipe')
  })

  it('2. Propage la taille et la forme aux avatars enfants via provide/inject', () => {
    const wrapper = mount(AvatarGroup, {
      props: {
        size: 'lg',
        shape: 'rounded'
      },
      slots: {
        default: () => [h(Avatar, { fallback: 'AB' }), h(Avatar, { fallback: 'CD' })]
      }
    })

    expect(wrapper.classes()).toContain('[&>*]:rounded-2xl')
    expect(wrapper.text()).toContain('AB')
    expect(wrapper.text()).toContain('CD')
  })

  it('3. Applique les classes d’espacement négatif', () => {
    const wrapperTight = mount(AvatarGroup, {
      props: {
        spacing: 'tight',
        size: 'md'
      }
    })
    expect(wrapperTight.classes()).toContain('-space-x-3.5')

    const wrapperNormal = mount(AvatarGroup, {
      props: {
        spacing: 'normal',
        size: 'sm'
      }
    })
    expect(wrapperNormal.classes()).toContain('-space-x-2')
  })
})
