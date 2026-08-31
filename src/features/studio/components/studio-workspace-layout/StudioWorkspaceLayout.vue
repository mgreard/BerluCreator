<script setup lang="ts">
import { useId } from 'vue'
import { ToggleGroupItem, ToggleGroupRoot, type AcceptableValue } from 'reka-ui'
import { Heading } from '@/components/ui/heading'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import type {
  StudioWorkspaceLayoutProps,
  StudioWorkspaceLayoutSlots,
  StudioWorkspacePane
} from './types'

const { class: className = undefined } = defineProps<StudioWorkspaceLayoutProps>()
defineSlots<StudioWorkspaceLayoutSlots>()
const compactPane = defineModel<StudioWorkspacePane>('compactPane', { default: 'studio' })

const workspaceLabelId = useId()
const libraryLabelId = useId()
const inspectorLabelId = useId()

const compactPanes: Array<{
  value: StudioWorkspacePane
  label: string
  icon: string
}> = [
  { value: 'library', label: 'Bibliothèque', icon: 'category' },
  { value: 'studio', label: 'Studio', icon: 'dashboard' },
  { value: 'inspector', label: 'Inspecteur', icon: 'tune' }
]

function updateCompactPane(value: AcceptableValue | AcceptableValue[]): void {
  const next = Array.isArray(value) ? value[0] : value
  if (next === 'library' || next === 'studio' || next === 'inspector') {
    compactPane.value = next
  }
}
</script>

<template>
  <section
    :class="
      cn(
        'studio-workspace-layout grid h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-bg-base text-text-primary',
        className
      )
    "
    :aria-labelledby="workspaceLabelId"
    data-testid="studio-workspace-layout"
  >
    <Heading :id="workspaceLabelId" as="h1" variant="sm" class="sr-only">
      Studio de composition
    </Heading>

    <header
      id="studio-global-toolbar-host"
      class="relative z-20 min-w-0 shrink-0 border-b border-border-default bg-bg-elevated empty:hidden"
      data-layout-region="header"
    >
      <slot name="header" />
    </header>

    <nav
      class="hidden min-h-11 items-center border-b border-border-default bg-bg-surface px-2 max-[1100px]:flex"
      aria-label="Espaces de travail du Studio"
      data-layout-region="compact-navigation"
    >
      <ToggleGroupRoot
        type="single"
        :model-value="compactPane"
        class="grid w-full grid-cols-3 gap-1"
        @update:model-value="updateCompactPane"
      >
        <ToggleGroupItem
          v-for="pane in compactPanes"
          :key="pane.value"
          :value="pane.value"
          :disabled="pane.value === 'inspector' && !$slots.right"
          class="flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-text-secondary outline-none transition-colors hover:bg-bg-surface-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary data-[state=on]:bg-primary data-[state=on]:text-text-inverse disabled:pointer-events-none disabled:opacity-40"
        >
          <Icon :name="pane.icon" size="xs" />
          <span class="truncate">{{ pane.label }}</span>
        </ToggleGroupItem>
      </ToggleGroupRoot>
    </nav>

    <div
      class="grid h-full min-h-0 min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] overflow-hidden max-[1100px]:grid-cols-1"
    >
      <aside
        v-if="$slots.left"
        :class="
          cn(
            'flex min-h-0 min-w-0 shrink-0 overflow-hidden border-r border-border-default bg-bg-surface max-[1100px]:w-full max-[1100px]:border-r-0',
            compactPane !== 'library' && 'max-[1100px]:hidden'
          )
        "
        :aria-labelledby="libraryLabelId"
        data-layout-region="left"
      >
        <Heading :id="libraryLabelId" as="h2" variant="sm" class="sr-only">
          Bibliothèque d’assets
        </Heading>
        <slot name="left" />
      </aside>

      <main
        :class="
          cn(
            'relative flex min-h-0 min-w-0 flex-col overflow-hidden bg-bg-base',
            compactPane !== 'studio' && 'max-[1100px]:hidden'
          )
        "
        data-layout-region="main"
      >
        <slot />
      </main>

      <aside
        v-if="$slots.right"
        :class="
          cn(
            'flex min-h-0 min-w-0 shrink-0 overflow-visible border-l border-border-default bg-bg-surface max-[1100px]:w-full max-[1100px]:border-l-0',
            compactPane !== 'inspector' && 'max-[1100px]:hidden'
          )
        "
        :aria-labelledby="inspectorLabelId"
        data-layout-region="right"
      >
        <Heading :id="inspectorLabelId" as="h2" variant="sm" class="sr-only">
          Inspecteur du Studio
        </Heading>
        <slot name="right" />
      </aside>
    </div>

    <footer
      id="studio-context-toolbar-host"
      :class="
        cn(
          'relative z-20 min-w-0 shrink-0 border-t border-border-default bg-bg-elevated empty:hidden',
          compactPane !== 'studio' && 'max-[1100px]:hidden'
        )
      "
      data-layout-region="footer"
    >
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped>
.studio-workspace-layout {
  grid-template-rows: auto auto minmax(0, 1fr) auto;
}
</style>
