import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StarRating from './StarRating.vue'

describe('StarRating (Colocated Unit Tests)', () => {
  it('1. Rend le nombre d’étoiles configuré avec les rôles WAI-ARIA', () => {
    const wrapper = mount(StarRating, {
      props: {
        maxStars: 5,
        modelValue: 3
      }
    })

    const group = wrapper.find('[role="radiogroup"]')
    expect(group.exists()).toBe(true)

    const stars = wrapper.findAll('button[role="radio"]')
    expect(stars).toHaveLength(5)
    expect(stars[0].classes()).toContain('text-warning')
    expect(stars[2].classes()).toContain('text-warning')
    expect(stars[3].classes()).toContain('text-border-default')
  })

  it('2. Met à jour la note et émet change au clic', async () => {
    const wrapper = mount(StarRating, {
      props: {
        modelValue: 2
      }
    })

    const stars = wrapper.findAll('button[role="radio"]')
    await stars[3].trigger('click') // 4ème étoile

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([4])
    expect(wrapper.emitted('change')?.[0]).toEqual([4])
  })

  it('3. Affiche la valeur textuelle quand showValue est vrai', () => {
    const wrapper = mount(StarRating, {
      props: {
        modelValue: 4,
        maxStars: 5,
        showValue: true
      }
    })

    expect(wrapper.text()).toContain('4 / 5')
  })

  it('4. Empêche la modification en mode readonly ou disabled', async () => {
    const wrapper = mount(StarRating, {
      props: {
        modelValue: 2,
        readonly: true
      }
    })

    const stars = wrapper.findAll('button[role="radio"]')
    await stars[4].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
