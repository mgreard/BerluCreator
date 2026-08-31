<script setup lang="ts">
import { ref, computed, onMounted, watch, useId } from 'vue'
import { cn } from '@/shared/utils/cn'
import type { SplashScreenProps, SplashScreenEmits } from './types'

const {
  isLoading = true,
  statusMessage = 'Chargement du studio...',
  progress = undefined,
  showProgress = true,
  minDurationMs = 1000,
  class: className = undefined
} = defineProps<SplashScreenProps>()

const emit = defineEmits<SplashScreenEmits>()

const instanceId = useId()
const yellowGradId = `yellow-grad-${instanceId}`
const purpleGradId = `purple-grad-${instanceId}`
const whiteGradId = `white-grad-${instanceId}`
const shimmerGradId = `shimmer-grad-${instanceId}`
const glowFilterId = `glow-filter-${instanceId}`

const isVisible = ref(true)
const isMountedTime = ref(Date.now())

const isProgressDeterminate = computed(
  () => typeof progress === 'number' && progress >= 0 && progress <= 100
)

const clampedProgress = computed(() => {
  if (typeof progress !== 'number') return 0
  return Math.min(100, Math.max(0, progress))
})

const handleVisibility = () => {
  if (!isLoading) {
    const elapsed = Date.now() - isMountedTime.value
    const remaining = Math.max(0, minDurationMs - elapsed)

    if (remaining > 0) {
      const timer = setTimeout(() => {
        isVisible.value = false
      }, remaining)
      return () => clearTimeout(timer)
    } else {
      isVisible.value = false
    }
  } else {
    isVisible.value = true
  }
}

onMounted(() => {
  isMountedTime.value = Date.now()
  handleVisibility()
})

watch(() => isLoading, handleVisibility)

const handleAfterLeave = () => {
  emit('completed')
}
</script>

<template>
  <Transition
    name="splash-fade"
    appear
    @after-leave="handleAfterLeave"
  >
    <div
      v-if="isVisible"
      role="status"
      aria-live="polite"
      :aria-busy="isLoading"
      :class="
        cn(
          'fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden',
          'bg-[#06040a] text-white',
          className
        )
      "
    >
      <!-- Fond d'ambiance avec halos lumineux subtils (Violet Cosmique & Doré) -->
      <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <!-- Halo violet central/haut -->
        <div
          class="absolute -top-[15%] left-1/2 -translate-x-1/2 size-[650px] rounded-full bg-purple-600/20 blur-[130px] transition-opacity duration-1000"
        />
        <!-- Halo violet profond pulsant -->
        <div
          class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[420px] rounded-full bg-violet-700/25 blur-[100px] animate-pulse"
          style="animation-duration: 4s;"
        />
        <!-- Halo doré chaud discret au bas du logo -->
        <div
          class="absolute top-1/2 left-[30%] -translate-x-1/2 size-[320px] rounded-full bg-amber-500/12 blur-[90px]"
        />
        <!-- Vignetage sombre périphérique -->
        <div
          class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(4,2,7,0.85)_100%)]"
        />
      </div>

      <!-- Contenu central du SplashScreen -->
      <div class="relative z-10 flex flex-col items-center px-6 text-center max-w-xl w-full">
        <!-- Logo SVG Typographique "Incroyaux News Studio" -->
        <div class="relative w-full max-w-[520px] py-4 flex items-center justify-center">
          <svg
            viewBox="0 0 680 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="w-full h-auto drop-shadow-2xl overflow-visible transform transition-transform duration-700 hover:scale-[1.01]"
            aria-label="Incroyaux News Studio"
          >
            <defs>
              <!-- Dégradé Jaune Solaire pour "Incroyaux" -->
              <linearGradient :id="yellowGradId" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FEF08A" />
                <stop offset="35%" stop-color="#FACC15" />
                <stop offset="100%" stop-color="#EAB308" />
              </linearGradient>

              <!-- Dégradé Violet Électrique pour "News" -->
              <linearGradient :id="purpleGradId" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#F0ABFC" />
                <stop offset="45%" stop-color="#C084FC" />
                <stop offset="100%" stop-color="#9333EA" />
              </linearGradient>

              <!-- Dégradé Blanc / Argent pour "STUDIO" -->
              <linearGradient :id="whiteGradId" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#FFFFFF" />
                <stop offset="50%" stop-color="#F1F5F9" />
                <stop offset="100%" stop-color="#CBD5E1" />
              </linearGradient>

              <!-- Dégradé de Shimmer lumineux animé -->
              <linearGradient :id="shimmerGradId" x1="-100%" y1="0%" x2="200%" y2="0%">
                <stop offset="0%" stop-color="rgba(255,255,255,0)" />
                <stop offset="45%" stop-color="rgba(255,255,255,0.05)" />
                <stop offset="50%" stop-color="rgba(255,255,255,0.35)" />
                <stop offset="55%" stop-color="rgba(255,255,255,0.05)" />
                <stop offset="100%" stop-color="rgba(255,255,255,0)" />
                <animate
                  attributeName="x1"
                  from="-100%"
                  to="150%"
                  dur="3s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="x2"
                  from="0%"
                  to="250%"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </linearGradient>

              <!-- Filtre de Lueur Douce (Soft Glow) -->
              <filter :id="glowFilterId" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <!-- Arrière-plan de lueur sous les textes -->
            <g opacity="0.35" :filter="`url(#${glowFilterId})`" class="animate-pulse" style="animation-duration: 3.5s;">
              <text
                x="20"
                y="92"
                font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif"
                font-size="68"
                font-weight="900"
                letter-spacing="-0.03em"
                :fill="`url(#${yellowGradId})`"
              >
                Incroyaux
              </text>
              <text
                x="415"
                y="92"
                font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif"
                font-size="68"
                font-weight="900"
                letter-spacing="-0.03em"
                :fill="`url(#${purpleGradId})`"
              >
                News
              </text>
            </g>

            <!-- Texte Principal : "Incroyaux" (Jaune) & "News" (Violet) -->
            <g class="logo-main-text">
              <text
                x="20"
                y="92"
                font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif"
                font-size="68"
                font-weight="900"
                letter-spacing="-0.03em"
                :fill="`url(#${yellowGradId})`"
              >
                Incroyaux
              </text>

              <text
                x="415"
                y="92"
                font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif"
                font-size="68"
                font-weight="900"
                letter-spacing="-0.03em"
                :fill="`url(#${purpleGradId})`"
              >
                News
              </text>

              <!-- Couche de Shimmer Lumineux passant sur Incroyaux News -->
              <text
                x="20"
                y="92"
                font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif"
                font-size="68"
                font-weight="900"
                letter-spacing="-0.03em"
                :fill="`url(#${shimmerGradId})`"
                style="mix-blend-mode: overlay;"
              >
                Incroyaux
              </text>

              <text
                x="415"
                y="92"
                font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif"
                font-size="68"
                font-weight="900"
                letter-spacing="-0.03em"
                :fill="`url(#${shimmerGradId})`"
                style="mix-blend-mode: overlay;"
              >
                News
              </text>
            </g>

            <!-- Ligne de Séparation & Accents "STUDIO" (Blanc Pur & Élégant) -->
            <g transform="translate(0, 115)">
              <!-- Ligne décorative gauche -->
              <line
                x1="40"
                y1="22"
                x2="220"
                y2="22"
                stroke="rgba(255,255,255,0.18)"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <circle cx="220" cy="22" r="2.5" fill="#FACC15" />

              <!-- Sous-titre "STUDIO" Blanc -->
              <text
                x="340"
                y="29"
                text-anchor="middle"
                font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif"
                font-size="22"
                font-weight="800"
                letter-spacing="0.42em"
                :fill="`url(#${whiteGradId})`"
                class="studio-text uppercase"
              >
                STUDIO
              </text>

              <!-- Ligne décorative droite -->
              <circle cx="460" cy="22" r="2.5" fill="#C084FC" />
              <line
                x1="460"
                y1="22"
                x2="640"
                y2="22"
                stroke="rgba(255,255,255,0.18)"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </g>
          </svg>
        </div>

        <!-- Section Statut & Progression -->
        <div class="mt-8 flex flex-col items-center gap-3 w-full max-w-[280px]">
          <!-- Message d'état réactif -->
          <div class="flex items-center gap-2 text-xs sm:text-sm font-medium text-purple-200/80 tracking-wide">
            <span class="inline-block size-2 rounded-full bg-amber-400 animate-ping" aria-hidden="true" />
            <span>{{ statusMessage }}</span>
          </div>

          <!-- Barre de chargement moderne & élégante -->
          <div
            v-if="showProgress"
            class="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10 border border-white/5 backdrop-blur-md"
            role="progressbar"
            :aria-valuenow="isProgressDeterminate ? clampedProgress : undefined"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <!-- Mode déterminé avec pourcentage -->
            <div
              v-if="isProgressDeterminate"
              class="h-full rounded-full bg-gradient-to-r from-amber-400 via-purple-500 to-violet-400 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(192,132,252,0.6)]"
              :style="{ width: `${clampedProgress}%` }"
            />

            <!-- Mode indéterminé / fluide (animation de navette lumineuse) -->
            <div
              v-else
              class="indeterminate-bar h-full rounded-full bg-gradient-to-r from-amber-400 via-purple-400 to-indigo-400 shadow-[0_0_14px_rgba(250,204,21,0.5)]"
            />
          </div>

          <!-- Affichage du pourcentage si déterminé -->
          <div
            v-if="showProgress && isProgressDeterminate"
            class="text-[11px] font-mono text-white/50 tracking-wider"
          >
            {{ Math.round(clampedProgress) }}%
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Transition douce de sortie du SplashScreen */
.splash-fade-enter-active,
.splash-fade-leave-active {
  transition: opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
}

.splash-fade-enter-from {
  opacity: 0;
  transform: scale(0.97);
}

.splash-fade-leave-to {
  opacity: 0;
  transform: scale(1.03);
  filter: blur(8px);
}

/* Animation de la barre de progression indéterminée */
@keyframes indeterminate-slide {
  0% {
    transform: translateX(-100%) scaleX(0.3);
  }
  50% {
    transform: translateX(30%) scaleX(0.7);
  }
  100% {
    transform: translateX(250%) scaleX(0.3);
  }
}

.indeterminate-bar {
  width: 50%;
  animation: indeterminate-slide 1.8s infinite ease-in-out;
}
</style>
