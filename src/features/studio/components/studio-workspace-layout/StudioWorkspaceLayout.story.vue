<script setup lang="ts">
import StudioWorkspaceLayout from './StudioWorkspaceLayout.vue'
</script>

<template>
  <Story title="Studio/WorkspaceLayout" :layout="{ type: 'single', iframe: true }">
    <Variant title="Toutes les régions">
      <div class="h-[640px] overflow-hidden border border-border-default bg-bg-base">
        <StudioWorkspaceLayout>
          <template #header>
            <div class="flex h-12 items-center px-4 text-sm font-semibold">Barre globale</div>
          </template>
          <template #left>
            <div class="w-72 p-4 text-sm">Bibliothèque</div>
          </template>
          <div class="flex size-full items-center justify-center text-sm text-text-muted">
            Viewport
          </div>
          <template #right>
            <div class="w-80 p-4 text-sm">Inspecteur</div>
          </template>
          <template #footer>
            <div class="flex h-11 items-center justify-center text-sm">Outils contextuels</div>
          </template>
        </StudioWorkspaceLayout>
      </div>
    </Variant>

    <Variant title="Viewport seul">
      <div class="h-[480px] overflow-hidden border border-border-default bg-bg-base">
        <StudioWorkspaceLayout>
          <div class="flex size-full items-center justify-center text-sm text-text-muted">
            Viewport sans panneau
          </div>
        </StudioWorkspaceLayout>
      </div>
    </Variant>
  </Story>
</template>
