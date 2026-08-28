import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import type { EditorLayer } from '@core/types/editor.types'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useAssetStore } from '../stores/useAssetStore'
import AssetUploadModal from './AssetUploadModal.vue'

function findMode(label: string): HTMLElement {
  const mode = [...document.body.querySelectorAll<HTMLElement>('[role="radio"]')].find((element) =>
    element.textContent?.includes(label)
  )
  if (!mode) throw new Error(`Mode d’import introuvable : ${label}`)
  return mode
}

function findButton(label: string): HTMLButtonElement {
  const button = [...document.body.querySelectorAll<HTMLButtonElement>('button')].find((element) =>
    element.textContent?.includes(label)
  )
  if (!button) throw new Error(`Bouton introuvable : ${label}`)
  return button
}

function characterAsset(key: string, name: string, category: AssetCategory = 'head'): Asset {
  return {
    id: `${key}-${category}`,
    name: `${name} ${category}`,
    category,
    tags: [category],
    blobId: `blob-${key}-${category}`,
    width: 840,
    height: 908,
    character: { key, name, form: category === 'character_full' ? 'full' : 'rig' },
    isMovable: false,
    createdAt: 1,
    updatedAt: 1
  }
}

function mountModal(
  props: { open: boolean; initialCategory?: AssetCategory; initialCharacterKey?: string } = {
    open: true
  },
  assets: Asset[] = []
): {
  wrapper: VueWrapper
  assetStore: ReturnType<typeof useAssetStore>
  editorStore: ReturnType<typeof useEditorStore>
} {
  const pinia = createPinia()
  setActivePinia(pinia)
  const assetStore = useAssetStore()
  const editorStore = useEditorStore()
  assetStore.assets.push(...assets)
  const wrapper = mount(AssetUploadModal, {
    props,
    global: { plugins: [pinia] },
    attachTo: document.body
  })
  return { wrapper, assetStore, editorStore }
}

async function addFile(name = 'sprite.png'): Promise<void> {
  let input: HTMLInputElement | null = null
  await vi.waitFor(() => {
    input = document.querySelector<HTMLInputElement>('input[type="file"]')
    expect(input).not.toBeNull()
  })
  Object.defineProperty(input!, 'files', {
    configurable: true,
    value: [new File(['sprite'], name, { type: 'image/png' })]
  })
  input!.dispatchEvent(new Event('change', { bubbles: true }))
  await nextTick()
}

describe('AssetUploadModal', () => {
  it('sélectionne le personnage complet par défaut à chaque ouverture', async () => {
    const { wrapper } = mountModal()

    await vi.waitFor(() => {
      expect(findMode('Personnage complet').getAttribute('aria-checked')).toBe('true')
      expect(findMode('Élément du squelette').getAttribute('aria-checked')).toBe('false')
      expect(document.body.textContent).toContain('Personnages complets')
    })

    findMode('Élément du squelette').click()
    await vi.waitFor(() => {
      expect(findMode('Élément du squelette').getAttribute('aria-checked')).toBe('true')
    })

    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })

    await vi.waitFor(() => {
      expect(findMode('Personnage complet').getAttribute('aria-checked')).toBe('true')
      expect(findMode('Élément du squelette').getAttribute('aria-checked')).toBe('false')
      expect(document.body.textContent).toContain('Personnages complets')
    })
  })

  it('reprend la catégorie de plateau active à l’ouverture', async () => {
    mountModal({ open: true, initialCategory: 'foreground' })

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Premier plan')
      expect(document.body.textContent).toContain("Sélectionnez le type d'élément de décor")
      expect(document.body.textContent).not.toContain('Destination du sprite')
    })
  })

  it('reprend le personnage et la sous-catégorie actifs à l’ouverture', async () => {
    mountModal({ open: true, initialCategory: 'head', initialCharacterKey: 'pedro' }, [
      characterAsset('pedro', 'Pedro')
    ])

    await vi.waitFor(() => {
      expect(findMode('Élément du squelette').getAttribute('aria-checked')).toBe('true')
      expect(document.body.textContent).toContain('Têtes & Visages')
      expect(document.querySelector('[aria-label="Personnage existant"]')?.textContent).toContain(
        'Pedro'
      )
    })
  })

  it('importe un sprite dans le personnage existant sélectionné', async () => {
    const pedro = characterAsset('pedro', 'Pedro')
    const { assetStore, editorStore } = mountModal(
      { open: true, initialCategory: 'head', initialCharacterKey: 'pedro' },
      [pedro]
    )
    const imported = characterAsset('pedro', 'Pedro')
    imported.id = 'asset-imported'
    const importAsset = vi.spyOn(assetStore, 'importAsset').mockResolvedValue(imported)
    vi.spyOn(editorStore, 'assignAssetToGroup').mockReturnValue({} as EditorLayer)

    await addFile('nouvelle-tete.png')
    await vi.waitFor(() => expect(findButton('Importer (1)')).toBeTruthy())
    findButton('Importer (1)').click()

    await vi.waitFor(() => {
      expect(importAsset).toHaveBeenCalledWith(expect.any(File), 'head', 'nouvelle-tete', [], {
        key: 'pedro',
        name: 'Pedro',
        form: 'rig'
      })
    })
  })

  it('permet de créer un nouveau personnage pendant l’import', async () => {
    const { assetStore, editorStore } = mountModal({
      open: true,
      initialCategory: 'character_full'
    })
    const imported = characterAsset('alice-invitee', 'Alice Invitée', 'character_full')
    const importAsset = vi.spyOn(assetStore, 'importAsset').mockResolvedValue(imported)
    vi.spyOn(editorStore, 'assignAssetToGroup').mockReturnValue({} as EditorLayer)

    await vi.waitFor(() => expect(findButton('Nouveau')).toBeTruthy())
    findButton('Nouveau').click()
    await vi.waitFor(() => {
      expect(document.querySelector('[aria-label="Nom du nouveau personnage"]')).not.toBeNull()
    })
    const nameInput = document.querySelector<HTMLInputElement>(
      '[aria-label="Nom du nouveau personnage"]'
    )!
    nameInput.value = 'Alice Invitée'
    nameInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    await addFile('alice.png')
    await vi.waitFor(() => expect(findButton('Importer (1)')).toBeTruthy())
    findButton('Importer (1)').click()

    await vi.waitFor(() => {
      expect(importAsset).toHaveBeenCalledWith(expect.any(File), 'character_full', 'alice', [], {
        key: 'alice-invitee',
        name: 'Alice Invitée',
        form: 'full'
      })
    })
  })
})
