<script setup lang="ts">
import { ref } from 'vue'
import Popover from './Popover.vue'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import type { PopoverProps, PopoverSide, PopoverAlign, PopoverWidth } from './types'

const sides: PopoverSide[] = ['top', 'right', 'bottom', 'left']
const aligns: PopoverAlign[] = ['start', 'center', 'end']
const widths: PopoverWidth[] = ['sm', 'md', 'lg', 'auto']
const surfaces = ['solid', 'glass'] as const

const state = ref<PopoverProps>({
  title: 'Paramètres du filtre',
  description: 'Ajustez les options de recherche',
  side: 'bottom',
  align: 'center',
  width: 'md',
  surface: 'solid',
  arrow: true,
  showClose: true,
  modal: false
})
</script>

<template>
  <Story title="Overlay/Popover" :layout="{ type: 'grid', width: '380px' }">
    <Variant title="Simple Profile Card">
      <div
        class="flex items-center justify-center p-12 bg-bg-surface border border-border-default rounded-xl"
      >
        <Popover title="Profil Utilisateur" description="Détails du compte connecté" width="sm">
          <template #trigger>
            <Button variant="secondary">Mon Profil</Button>
          </template>
          <div class="flex flex-col gap-2">
            <p class="text-xs text-text-secondary">
              Connecté en tant que <strong>alexandre@example.com</strong>.
            </p>
          </div>
          <template #footer>
            <Button size="sm" variant="ghost">Déconnexion</Button>
            <Button size="sm" variant="primary">Gérer</Button>
          </template>
        </Popover>
      </div>
    </Variant>

    <Variant title="With Icon Trigger & Arrow">
      <div
        class="flex items-center justify-center p-12 bg-bg-surface border border-border-default rounded-xl"
      >
        <Popover title="Aide & Astuces" :arrow="true" width="md">
          <template #trigger>
            <IconButton aria-label="Aide">
              <Icon name="help" size="sm" />
            </IconButton>
          </template>
          <p class="text-xs text-text-secondary leading-relaxed">
            Utilisez les touches de raccourci
            <kbd
              class="px-1.5 py-0.5 rounded bg-bg-elevated border border-border-default text-xs font-mono"
              >⌘ + K</kbd
            >
            pour ouvrir la palette de commandes.
          </p>
        </Popover>
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div
          class="flex items-center justify-center p-16 bg-bg-surface border border-border-default rounded-xl w-full"
        >
          <Popover v-bind="state">
            <template #trigger>
              <Button variant="primary">Ouvrir Popover</Button>
            </template>
            <div class="flex flex-col gap-3">
              <p class="text-xs text-text-secondary leading-relaxed">
                Contenu interactif rendu dans un portail document.body sur une surface lisible.
              </p>
            </div>
            <template #footer>
              <Button size="sm" variant="secondary">Annuler</Button>
              <Button size="sm" variant="primary">Appliquer</Button>
            </template>
          </Popover>
        </div>
      </template>
      <template #controls>
        <HstText v-model="state.title" title="Title" />
        <HstText v-model="state.description" title="Description" />
        <HstSelect v-model="state.side" title="Side" :options="sides" />
        <HstSelect v-model="state.align" title="Align" :options="aligns" />
        <HstSelect v-model="state.width" title="Width" :options="widths" />
        <HstSelect v-model="state.surface" title="Surface" :options="surfaces" />
        <HstCheckbox v-model="state.arrow" title="Arrow" />
        <HstCheckbox v-model="state.showClose" title="Show Close" />
        <HstCheckbox v-model="state.modal" title="Modal" />
      </template>
    </Variant>
  </Story>
</template>
