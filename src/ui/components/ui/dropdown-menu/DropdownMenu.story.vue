<script setup lang="ts">
import { ref } from 'vue'
import DropdownMenu from './DropdownMenu.vue'
import { Button } from '@/components/ui/button'
import type { DropdownMenuProps, DropdownMenuItemDef } from './types'

const isOpen = ref(false)
const isGlassOpen = ref(false)

const items: DropdownMenuItemDef[] = [
  { type: 'label', label: 'Mon Compte' },
  { id: 'profile', label: 'Profil', icon: 'person', shortcut: '⇧⌘P' },
  { id: 'billing', label: 'Facturation', icon: 'credit_card', shortcut: '⌘B' },
  { id: 'settings', label: 'Paramètres', icon: 'settings', shortcut: '⌘S' },
  { type: 'separator' },
  {
    id: 'team',
    label: 'Inviter des membres',
    icon: 'group_add',
    children: [
      { id: 'email', label: 'Par Email', icon: 'mail' },
      { id: 'link', label: 'Copier le lien', icon: 'link' }
    ]
  },
  { type: 'separator' },
  { id: 'logout', label: 'Se déconnecter', icon: 'logout', destructive: true, shortcut: '⇧⌘Q' }
]

const state = ref<DropdownMenuProps>({
  items,
  align: 'start',
  side: 'bottom',
  width: 'md',
  surface: 'solid'
})
</script>

<template>
  <Story title="Overlay/DropdownMenu" :layout="{ type: 'single' }">
    <Variant title="Standard Actions & Submenu">
      <div
        class="flex items-center justify-center p-16 bg-bg-surface border border-border-default rounded-2xl"
      >
        <DropdownMenu v-model:open="isOpen" v-bind="state">
          <template #trigger>
            <Button variant="secondary"> Options du compte </Button>
          </template>
        </DropdownMenu>
      </div>
    </Variant>

    <Variant title="Glass (Opt-in)">
      <div
        class="flex items-center justify-center p-16 bg-bg-base border border-border-default rounded-2xl"
      >
        <DropdownMenu v-model:open="isGlassOpen" :items="items" surface="glass" width="md">
          <template #trigger>
            <Button variant="secondary">Menu vitré optionnel</Button>
          </template>
        </DropdownMenu>
      </div>
    </Variant>
  </Story>
</template>
