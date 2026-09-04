<script setup lang="ts">
import WorkspaceBackupMenu from '@/features/project/components/WorkspaceBackupMenu.vue'
import type { AssetLibraryGlobalActionsEmits } from './types'

const emit = defineEmits<AssetLibraryGlobalActionsEmits>()
</script>

<template>
  <div
    class="flex shrink-0 items-center gap-1 rounded-lg border border-border-default bg-bg-surface p-0.5"
    data-studio-primary-actions
    role="group"
    aria-label="Projet et application"
  >
    <!-- Logo Compact Incroyaux News Studio -->
    <div
      class="flex items-center gap-1 px-2 py-0.5 select-none"
      title="Incroyaux News Studio"
      aria-label="Incroyaux News Studio"
    >
      <svg
        viewBox="0 0 240 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="h-4.5 w-auto transition-transform duration-200 hover:scale-105"
      >
        <defs>
          <linearGradient id="header-logo-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FEF08A" />
            <stop offset="100%" stop-color="#EAB308" />
          </linearGradient>
          <linearGradient id="header-logo-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#F0ABFC" />
            <stop offset="100%" stop-color="#A855F7" />
          </linearGradient>
        </defs>
        <text
          x="0"
          y="26"
          font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif"
          font-size="22"
          font-weight="900"
          letter-spacing="-0.03em"
          fill="url(#header-logo-yellow)"
        >
          Incroyaux
        </text>
        <text
          x="110"
          y="26"
          font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif"
          font-size="22"
          font-weight="900"
          letter-spacing="-0.03em"
          fill="url(#header-logo-purple)"
        >
          News
        </text>
        <text
          x="178"
          y="26"
          font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif"
          font-size="10"
          font-weight="800"
          letter-spacing="0.18em"
          fill="#FFFFFF"
          opacity="0.9"
        >
          STUDIO
        </text>
      </svg>
    </div>

    <div class="mx-0.5 h-4 w-px bg-border-default shrink-0" aria-hidden="true" />

    <WorkspaceBackupMenu
      placement="header"
      @open-settings="emit('openSettings')"
      @open-batch-export="emit('openBatchExport')"
      @open-change="emit('projectMenuOpen', $event)"
    />
  </div>
</template>
