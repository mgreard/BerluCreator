<script setup lang="ts">
import { useProjectStore } from '../stores/useProjectStore'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'

const emit = defineEmits<{
  (e: 'openSettings'): void
  (e: 'openExport'): void
  (e: 'openAiDirector'): void
}>()

const projectStore = useProjectStore()
</script>

<template>
  <header class="h-12 border-b border-border/40 px-4 flex items-center justify-between bg-surface/70 backdrop-blur-xl z-20 select-none">
    <!-- Logo & Titre de Projet -->
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-glass-sm">
          <Icon name="movie" size="sm" />
        </div>
        <div>
          <h1 class="text-sm font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            BerluCreator
          </h1>
          <span class="text-[10px] text-muted-foreground block -mt-1 font-mono">
            Studio 2D Stop-Motion
          </span>
        </div>
      </div>

      <div class="h-5 w-px bg-border/60" />

      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-foreground truncate max-w-xs">
          {{ projectStore.currentProject.name }}
        </span>
        <Badge v-if="projectStore.isSaving" variant="neutral" size="sm" class="text-[10px] animate-pulse">
          Sauvegarde...
        </Badge>
        <Badge v-else variant="success" size="sm" class="text-[10px]">
          Local-First DB
        </Badge>
      </div>
    </div>

    <!-- Actions du Studio -->
    <div class="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        class="gap-1.5 text-xs"
        @click="emit('openAiDirector')"
      >
        <Icon name="auto_awesome" size="xs" class="text-amber-400" />
        <span>Scénariste IA</span>
      </Button>

      <IconButton
        icon="settings"
        size="sm"
        variant="ghost"
        title="Paramètres de scène et de plateau"
        @click="emit('openSettings')"
      />

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
