import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { Asset } from '@core/types/asset.types'
import AssetCard from './AssetCard.vue'

const { acquireSource, releaseSource, acquireThumbnail, releaseThumbnail } = vi.hoisted(() => ({
  acquireSource: vi.fn(async () => 'blob:source'),
  releaseSource: vi.fn(),
  acquireThumbnail: vi.fn(async () => 'blob:thumbnail'),
  releaseThumbnail: vi.fn()
}))

vi.mock('@infrastructure/storage/blob-cache.service', () => ({
  blobCacheService: { acquire: acquireSource, release: releaseSource }
}))

vi.mock('../services/alpha-thumbnail-cache.service', () => ({
  alphaThumbnailCacheService: { acquire: acquireThumbnail, release: releaseThumbnail }
}))

const headAsset: Asset = {
  id: 'head-1',
  name: 'Tête en colère avec un nom suffisamment long',
  category: 'head',
  tags: [],
  blobId: 'blob-head',
  width: 840,
  height: 908,
  isMovable: false,
  createdAt: 1,
  updatedAt: 1
}

describe('AssetCard', () => {
  it('affiche la miniature recadrée et les accents de sa catégorie', async () => {
    const wrapper = mount(AssetCard, { props: { asset: headAsset, selected: true } })
    await flushPromises()

    const card = wrapper.get('[role="option"]')
    expect(card.attributes('data-selected')).toBe('true')
    expect(card.attributes('style')).toContain('--asset-accent: #fb7185')
    expect(wrapper.get('img').attributes('src')).toBe('blob:thumbnail')
    expect(wrapper.text()).toContain('Têtes & Visages')
    expect(wrapper.text()).toContain('840×908')
    expect(acquireThumbnail).toHaveBeenCalledWith('blob-head', 'blob:source')
    expect(releaseSource).toHaveBeenCalledWith('blob-head')
  })

  it('conserve un skeleton jusqu’au décodage de la miniature puis affiche les erreurs', async () => {
    const wrapper = mount(AssetCard, { props: { asset: headAsset } })
    await flushPromises()

    const image = wrapper.get('img')
    expect(wrapper.get(`[aria-label="Chargement de ${headAsset.name}"]`)).toBeDefined()
    expect(image.classes()).toContain('opacity-0')

    await image.trigger('load')
    expect(wrapper.find(`[aria-label="Chargement de ${headAsset.name}"]`).exists()).toBe(false)
    expect(image.classes()).toContain('opacity-100')

    await image.trigger('error')
    expect(
      wrapper.get(`[aria-label="Aperçu indisponible pour ${headAsset.name}"]`).text()
    ).toContain('Aperçu indisponible')
  })

  it('conserve les actions de sélection et de suppression', async () => {
    const wrapper = mount(AssetCard, { props: { asset: headAsset } })
    await flushPromises()

    await wrapper.get('[role="option"]').trigger('click')
    await wrapper.get('button[aria-label^="Supprimer"]').trigger('click')

    expect(wrapper.emitted('select')).toEqual([[headAsset]])
    expect(wrapper.emitted('delete')).toEqual([[headAsset]])
  })

  it('propose une occurrence supplémentaire uniquement quand elle est autorisée', async () => {
    const wrapper = mount(AssetCard, {
      props: { asset: { ...headAsset, category: 'eyes' }, allowDuplicate: true }
    })
    await flushPromises()

    await wrapper.get('button[aria-label^="Ajouter une autre occurrence"]').trigger('click')
    expect(wrapper.emitted('duplicate')).toHaveLength(1)
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('affiche le bouton de découpe 2.5D pour les meubles de catégorie desk', async () => {
    const deskAsset: Asset = { ...headAsset, category: 'desk' }
    const wrapper = mount(AssetCard, {
      props: { asset: deskAsset }
    })
    await flushPromises()

    const splitBtn = wrapper.find('button[aria-label^="Découper la profondeur"]')
    expect(splitBtn.exists()).toBe(true)
    await splitBtn.trigger('click')
    expect(wrapper.emitted('split')).toEqual([[deskAsset]])
  })
})
