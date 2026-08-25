import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Breadcrumb from './Breadcrumb.vue'
import type { BreadcrumbItem } from './types'

const sampleItems: BreadcrumbItem[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Composants', href: '/components' },
  { label: 'Navigation', active: true }
]

describe('Breadcrumb (Colocated Unit Tests)', () => {
  it('1. Rend la liste complète des éléments avec les séparateurs', () => {
    const wrapper = mount(Breadcrumb, {
      props: {
        items: sampleItems,
        separator: '›'
      }
    })

    expect(wrapper.text()).toContain('Accueil')
    expect(wrapper.text()).toContain('Composants')
    expect(wrapper.text()).toContain('Navigation')
    expect(wrapper.text()).toContain('›')
  })

  it('2. Positionne aria-current="page" sur l’élément actif', () => {
    const wrapper = mount(Breadcrumb, {
      props: {
        items: sampleItems
      }
    })

    const activeItem = wrapper.find('[aria-current="page"]')
    expect(activeItem.exists()).toBe(true)
    expect(activeItem.text()).toContain('Navigation')
  })

  it('3. Applique les classes compactes lorsque compact est vrai', () => {
    const wrapper = mount(Breadcrumb, {
      props: {
        items: sampleItems,
        compact: true
      }
    })

    expect(wrapper.classes()).toContain('text-xs')
  })

  it('4. N’injecte pas d’attribut HTML to invalide sur les balises <a>', () => {
    const wrapper = mount(Breadcrumb, {
      props: {
        items: [
          { label: 'Accueil', href: '/' },
          { label: 'Détails', active: true }
        ]
      }
    })

    const link = wrapper.find('a')
    expect(link.exists()).toBe(true)
    expect(link.attributes('to')).toBeUndefined()
    expect(link.attributes('href')).toBe('/')
  })

  it('5. Déclenche le gestionnaire onClick lorsque fourni sur un élément', async () => {
    const onClickHandler = vi.fn()
    const wrapper = mount(Breadcrumb, {
      props: {
        items: [
          { label: 'Accueil', onClick: onClickHandler },
          { label: 'Page Courante', active: true }
        ]
      }
    })

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    await button.trigger('click')
    expect(onClickHandler).toHaveBeenCalledTimes(1)
  })

  it('6. Affiche les icônes associées aux items', () => {
    const wrapper = mount(Breadcrumb, {
      props: {
        items: [
          { label: 'Accueil', icon: '🏠', href: '/' },
          { label: 'Dashboard', active: true }
        ]
      }
    })

    expect(wrapper.text()).toContain('🏠')
  })
})
