<script setup lang="ts">
import { cn } from '@/shared/utils/cn'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import type { AuthLayoutProps } from './types'

const {
  brandTitle = 'MyCompLib',
  brandIcon = 'diamond',
  tagline = 'Connexion à votre espace sécurisé',
  cardWidth = 'max-w-md',
  class: className = undefined
} = defineProps<AuthLayoutProps>()
</script>

<template>
  <div
    :class="
      cn(
        '@container min-h-screen w-full flex flex-col items-center justify-center p-4 @sm:p-6 bg-bg-base relative overflow-hidden text-text-primary select-none',
        className
      )
    "
  >
    <!-- Cercles lumineux d'ambiance en arrière-plan (GPU backdrop) -->
    <div
      class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none -z-10"
      aria-hidden="true"
    />

    <!-- En-tête de marque -->
    <div class="flex flex-col items-center text-center mb-6 z-10 max-w-md w-full px-4">
      <div class="flex items-center gap-2.5 mb-2">
        <Icon
          v-if="brandIcon"
          :name="brandIcon"
          size="lg"
          class="text-primary shrink-0"
          aria-hidden="true"
        />
        <span
          class="font-display font-black text-xl @sm:text-2xl text-text-primary tracking-tight truncate"
        >
          {{ brandTitle }}
        </span>
      </div>
      <p class="text-xs @sm:text-sm text-text-muted m-0 line-clamp-2">
        {{ tagline }}
      </p>
    </div>

    <!-- Carte Centrale Authentification avec verre glass-premium -->
    <Card
      variant="elevated"
      padding="lg"
      :class="cn('w-full rounded-3xl shadow-glass-lg border border-border-default z-10', cardWidth)"
    >
      <slot />
    </Card>

    <!-- Pied de page Auth (Conditions, Liens légaux) -->
    <footer
      v-if="$slots.footer"
      class="mt-8 text-center text-xs text-text-muted z-10 max-w-md w-full px-4"
    >
      <slot name="footer" />
    </footer>
  </div>
</template>
