<script setup lang="ts">
import { useProjectStore } from '../stores/useProjectStore'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const emit = defineEmits<{
  (e: 'openSettings'): void
  (e: 'openExport'): void
  (e: 'openAiDirector'): void
}>()

const projectStore = useProjectStore()
</script>

<template>
  <header class="h-12 border-b border-border-subtle px-4 flex items-center justify-between bg-bg-surface/80 backdrop-blur-xl z-20 select-none">
    <!-- Logo & Titre de Projet -->
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-glow-sm">
          <Icon name="movie" size="sm" />
        </div>
        <div>
          <h1 class="text-sm font-black font-display tracking-tight bg-gradient-to-r from-text-primary via-text-primary/90 to-text-muted bg-clip-text text-transparent leading-none">
            BerluCreator
          </h1>
          <span class="text-[10px] text-text-muted font-mono block mt-0.5">
            Studio 2D Stop-Motion
          </span>
        </div>
      </div>

      <Separator orientation="vertical" variant="subtle" class="h-5 mx-1" />

      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-text-secondary truncate max-w-xs">
          {{ projectStore.currentProject.name }}
        </span>
        <Badge v-if="projectStore.isSaving" variant="neutral" size="sm" class="text-[10px] animate-pulse">
          Sauvegarde...
        </Badge>
        <Badge v-else variant="success" size="sm" class="text-[10px]">
          Local DB
        </Badge>
      </div>
    </div>

    <!-- Actions du Studio -->
    <div class="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        class="gap-1.5 text-xs text-text-secondary hover:text-text-primary"
        @click="emit('openAiDirector')"
      >
        <Icon name="auto_awesome" size="xs" class="text-amber-400" />
        <span>Scénariste IA</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        class="gap-1.5 text-xs text-text-secondary hover:text-text-primary"
        title="Paramètres de scène et de plateau"
        @click="emit('openSettings')"
      >
        <Icon name="settings" size="xs" />
        <span>Paramètres</span>
      </Button>

      <Button
        variant="primary"
        size="sm"
        class="gap-1.5 text-xs shadow-glass-sm"
        @click="emit('openExport')"
      >
        <Icon name="file_download" size="xs" />
        <span>Exporter</span>
      </Button>
    </div>
  </header>
</template>
