<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
  VisuallyHidden
} from 'reka-ui'
import { cn } from '@/shared/utils/cn'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import type { ShellProps, ShellEmits } from './types'

// Modèle bidirectionnel pour l'état étendu/replié sur desktop
const sidebarOpen = defineModel<boolean>('sidebarOpen', { default: true })

// État d'ouverture du tiroir mobile
const mobileDrawerOpen = ref(false)

const {
  collapsible = true,
  brandTitle = 'MyCompLib',
  brandIcon = 'diamond',
  class: className = undefined
} = defineProps<ShellProps>()

const emit = defineEmits<ShellEmits>()

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
  emit('toggle-sidebar', sidebarOpen.value)
}

function toggleMobileDrawer() {
  mobileDrawerOpen.value = !mobileDrawerOpen.value
}

const sidebarDesktopClasses = computed(() => {
  return cn(
    'hidden md:flex flex-col shrink-0 h-screen sticky top-0 z-30',
    'bg-bg-surface border-r border-border-default',
    'transition-[width] duration-300 ease-in-out',
    sidebarOpen.value ? 'w-64' : 'w-20'
  )
})
</script>

<template>
  <div
    :class="
      cn('min-h-screen w-full flex bg-bg-base text-text-primary overflow-x-hidden', className)
    "
  >
    <!-- 1. Tiroir Mobile Accessible avec DialogRoot (Focus Trap, Touche Échap, Scroll-Lock) -->
    <DialogRoot v-model:open="mobileDrawerOpen">
      <DialogPortal>
        <DialogOverlay
          class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300 animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        />
        <DialogContent
          class="fixed inset-y-0 left-0 z-50 w-72 flex flex-col md:hidden bg-bg-base border-r border-border-default shadow-lg transition-transform duration-300 ease-in-out outline-none animate-in slide-in-from-left data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left"
        >
          <VisuallyHidden>
            <DialogTitle>{{ brandTitle }} - Navigation mobile</DialogTitle>
          </VisuallyHidden>

          <!-- En-tête Sidebar Mobile -->
          <div
            class="h-16 flex items-center justify-between px-4 border-b border-border-default shrink-0"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <Icon v-if="brandIcon" :name="brandIcon" size="md" class="shrink-0 text-primary" />
              <span class="font-display font-bold text-base text-text-primary truncate">
                {{ brandTitle }}
              </span>
            </div>
            <DialogClose as-child>
              <IconButton variant="ghost" size="sm" aria-label="Fermer le menu" title="Fermer">
                <Icon name="close" size="xs" />
              </IconButton>
            </DialogClose>
          </div>

          <!-- Corps de Navigation Mobile -->
          <div class="flex-1 overflow-y-auto overscroll-contain p-3">
            <slot name="sidebar" :is-collapsed="false" :is-mobile="true" />
          </div>

          <!-- Pied de Sidebar Mobile -->
          <div v-if="$slots['sidebar-footer']" class="p-3 border-t border-border-default shrink-0">
            <slot name="sidebar-footer" :is-collapsed="false" :is-mobile="true" />
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- 3. Sidebar Desktop Persistante (Collapsible avec transition CSS fluide) -->
    <aside :class="sidebarDesktopClasses" aria-label="Navigation principale">
      <!-- En-tête Sidebar Desktop -->
      <div
        class="h-16 flex items-center justify-between px-4 border-b border-border-default shrink-0 overflow-hidden"
      >
        <slot name="sidebar-header" :is-collapsed="!sidebarOpen">
          <div class="flex items-center gap-3 min-w-0">
            <Icon
              v-if="brandIcon"
              :name="brandIcon"
              size="md"
              class="shrink-0 text-primary"
              aria-hidden="true"
            />
            <span
              v-if="sidebarOpen"
              class="font-display font-bold text-base text-text-primary truncate transition-opacity duration-200"
            >
              {{ brandTitle }}
            </span>
          </div>
        </slot>

        <IconButton
          v-if="collapsible"
          variant="ghost"
          size="sm"
          class="shrink-0 text-text-muted hover:text-text-primary"
          :aria-label="sidebarOpen ? 'Replier le menu' : 'Déplier le menu'"
          :title="sidebarOpen ? 'Replier' : 'Déplier'"
          @click="toggleSidebar"
        >
          <Icon :name="sidebarOpen ? 'chevron_left' : 'chevron_right'" size="xs" />
        </IconButton>
      </div>

      <!-- Corps de Navigation Desktop -->
      <div class="flex-1 overflow-y-auto overscroll-contain p-2.5 space-y-1">
        <slot name="sidebar" :is-collapsed="!sidebarOpen" :is-mobile="false" />
      </div>

      <!-- Pied de Sidebar Desktop -->
      <div
        v-if="$slots['sidebar-footer']"
        class="p-3 border-t border-border-default shrink-0 overflow-hidden"
      >
        <slot name="sidebar-footer" :is-collapsed="!sidebarOpen" :is-mobile="false" />
      </div>
    </aside>

    <!-- 4. Colonne de Contenu Principal (Header + Page Grid + Footer) -->
    <div class="flex-1 min-w-0 flex flex-col min-h-screen">
      <!-- Header Persistant -->
      <header
        class="h-16 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 border-b border-border-default bg-bg-surface shrink-0"
      >
        <div class="flex items-center gap-3 min-w-0">
          <!-- Bouton Menu Burger Mobile -->
          <IconButton
            variant="ghost"
            size="md"
            class="md:hidden text-text-muted hover:text-text-primary"
            aria-label="Ouvrir le menu de navigation"
            title="Menu"
            @click="toggleMobileDrawer"
          >
            ☰
          </IconButton>

          <!-- Zone Titre / Fil d'Ariane ou Recherche Header -->
          <div class="min-w-0 flex-1">
            <slot name="header">
              <span
                class="font-display font-semibold text-sm sm:text-base text-text-primary truncate"
              >
                {{ brandTitle }}
              </span>
            </slot>
          </div>
        </div>

        <!-- Actions Droite du Header (Profil, Notifications, Thème) -->
        <div class="flex items-center gap-2.5 shrink-0">
          <slot name="header-actions" />
        </div>
      </header>

      <!-- Zone de Vue / Page Layout Grid (Anti-Blowout min-w-0) -->
      <main class="flex-1 min-w-0 min-h-0 flex flex-col">
        <slot />
      </main>

      <!-- Footer Persistant -->
      <footer
        v-if="$slots.footer"
        class="border-t border-border-default bg-bg-surface/40 p-4 shrink-0"
      >
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>
