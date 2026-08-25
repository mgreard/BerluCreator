import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MentionInput from './MentionInput.vue'
import type { MentionTrigger } from './types'

interface User {
  id: string
  name: string
  role: string
}

const mockUsers: User[] = [
  { id: '1', name: 'Alice Dupont', role: 'Architecte' },
  { id: '2', name: 'Bob Martin', role: 'DevOps' },
  { id: '3', name: 'Charlie Durand', role: 'Designer' }
]

const userTrigger: MentionTrigger<User> = {
  char: '@',
  search: (q) => mockUsers.filter((u) => u.name.toLowerCase().includes(q.toLowerCase())),
  format: (u) => `@${u.name} `,
  label: (u) => u.name,
  key: (u) => u.id
}

const spacedUserTrigger: MentionTrigger<User> = {
  ...userTrigger,
  allowSpaces: true
}

const tagTrigger: MentionTrigger<string> = {
  char: '#',
  search: (q) =>
    ['design', 'refactor', 'bug', 'feature'].filter((t) => t.includes(q.toLowerCase())),
  format: (t) => `#${t} `
}

describe('MentionInput (Colocated Unit Tests)', () => {
  it('1. Rend un textarea par défaut avec le placeholder et les dimensions', () => {
    const wrapper = mount(MentionInput, {
      props: {
        placeholder: 'Ecrire un message...',
        rows: 4
      }
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
    expect(textarea.attributes('placeholder')).toBe('Ecrire un message...')
    expect(textarea.attributes('rows')).toBe('4')
  })

  it('2. Rend un input simple lorsque multiline est faux', () => {
    const wrapper = mount(MentionInput, {
      props: {
        multiline: false,
        placeholder: 'Titre...'
      }
    })

    expect(wrapper.find('textarea').exists()).toBe(false)
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('type')).toBe('text')
  })

  it('3. Ouvre le popover de suggestions lors de la saisie d’un déclencheur', async () => {
    const wrapper = mount(MentionInput, {
      props: {
        triggers: [userTrigger],
        modelValue: ''
      }
    })

    const textarea = wrapper.find('textarea')
    const el = textarea.element as HTMLTextAreaElement
    el.value = 'Bonjour @Ali'
    el.setSelectionRange(12, 12)

    await textarea.trigger('input')
    await nextTick()

    const listbox = wrapper.find('[role="listbox"]')
    expect(listbox.exists()).toBe(true)

    const options = wrapper.findAll('[role="option"]')
    expect(options.length).toBe(1)
    expect(options[0].text()).toContain('Alice Dupont')
  })

  it('4. Navigue au clavier avec ArrowDown / ArrowUp et ferme avec Escape', async () => {
    const wrapper = mount(MentionInput, {
      props: {
        triggers: [userTrigger],
        modelValue: ''
      }
    })

    const textarea = wrapper.find('textarea')
    const el = textarea.element as HTMLTextAreaElement
    el.value = '@'
    el.setSelectionRange(1, 1)

    await textarea.trigger('input')
    await nextTick()

    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)
    let options = wrapper.findAll('[role="option"]')
    expect(options[0].attributes('aria-selected')).toBe('true')

    await textarea.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    options = wrapper.findAll('[role="option"]')
    expect(options[1].attributes('aria-selected')).toBe('true')

    await textarea.trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('5. Insère la mention sélectionnée avec préservation setRangeText', async () => {
    const onSelect = vi.fn()
    const wrapper = mount(MentionInput, {
      props: {
        triggers: [userTrigger],
        modelValue: '',
        onSelect
      }
    })

    const textarea = wrapper.find('textarea')
    const el = textarea.element as HTMLTextAreaElement
    el.value = 'Hello @Bob'
    el.setSelectionRange(10, 10)

    await textarea.trigger('input')
    await nextTick()

    await textarea.trigger('keydown', { key: 'Enter' })
    await nextTick()

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Bob Martin' }),
      expect.objectContaining({ char: '@' })
    )
    expect(el.value).toContain('@Bob Martin')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('6. Gère plusieurs déclencheurs différents (@ et #)', async () => {
    const wrapper = mount(MentionInput, {
      props: {
        triggers: [userTrigger, tagTrigger],
        modelValue: ''
      }
    })

    const textarea = wrapper.find('textarea')
    const el = textarea.element as HTMLTextAreaElement

    el.value = 'Fix #bug'
    el.setSelectionRange(8, 8)
    await textarea.trigger('input')
    await nextTick()

    const listbox = wrapper.find('[role="listbox"]')
    expect(listbox.exists()).toBe(true)
    const option = listbox.find('[role="option"]')
    expect(option.exists()).toBe(true)
    expect(option.text()).toContain('bug')
  })

  it('7. Affiche et permet de supprimer les badges de prévisualisation', async () => {
    const wrapper = mount(MentionInput, {
      props: {
        triggers: [userTrigger, tagTrigger],
        previewBadges: true,
        modelValue: 'Message avec @Alice et #design'
      }
    })

    const badges = wrapper.findAllComponents({ name: 'Badge' })
    expect(badges.length).toBeGreaterThanOrEqual(2)

    const removeBtn = wrapper.find('button[aria-label="Supprimer le jeton"]')
    expect(removeBtn.exists()).toBe(true)
    await removeBtn.trigger('click')
    await nextTick()
  })

  it('8. Applique l’état disabled en désactivant le champ et masquant les boutons', () => {
    const wrapper = mount(MentionInput, {
      props: {
        disabled: true,
        triggers: [userTrigger]
      }
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('opacity-50')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('9. Autorise les noms composés lorsque le déclencheur accepte les espaces', async () => {
    const wrapper = mount(MentionInput, {
      props: {
        triggers: [spacedUserTrigger],
        modelValue: ''
      }
    })

    const textarea = wrapper.find('textarea')
    const el = textarea.element as HTMLTextAreaElement
    el.value = '@Alice Du'
    el.setSelectionRange(el.value.length, el.value.length)

    await textarea.trigger('input')
    await nextTick()

    expect(wrapper.findAll('[role="option"]')).toHaveLength(1)
    expect(wrapper.get('[role="option"]').text()).toContain('Alice Dupont')
  })

  it('10. Peut masquer la barre de raccourcis sans désactiver l’autocomplétion', async () => {
    const wrapper = mount(MentionInput, {
      props: {
        triggers: [userTrigger],
        showTriggerButtons: false
      }
    })

    expect(wrapper.text()).not.toContain('Raccourcis :')

    const textarea = wrapper.find('textarea')
    const el = textarea.element as HTMLTextAreaElement
    el.value = '@Ali'
    el.setSelectionRange(el.value.length, el.value.length)
    await textarea.trigger('input')
    await nextTick()

    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)
  })
})
