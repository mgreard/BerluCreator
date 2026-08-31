<script setup lang="ts">
import { ref } from 'vue'
import SplashScreen from './SplashScreen.vue'
import type { SplashScreenProps } from './types'

const state = ref<SplashScreenProps>({
  isLoading: true,
  statusMessage: 'Initialisation du studio...',
  progress: 45,
  showProgress: true,
  minDurationMs: 800
})

const isSimulating = ref(false)
const simulateLoad = () => {
  state.value.isLoading = true
  state.value.progress = 0
  state.value.statusMessage = 'Démarrage du moteur...'
  isSimulating.value = true

  const interval = setInterval(() => {
    if (typeof state.value.progress === 'number' && state.value.progress < 100) {
      state.value.progress += 20
      if (state.value.progress === 40) {
        state.value.statusMessage = 'Chargement des rigs et modèles...'
      } else if (state.value.progress === 80) {
        state.value.statusMessage = 'Préparation du viewport...'
      }
    } else {
      clearInterval(interval)
      state.value.statusMessage = 'Studio prêt !'
      setTimeout(() => {
        state.value.isLoading = false
        isSimulating.value = false
      }, 500)
    }
  }, 400)
}
</script>

<template>
  <Story title="Feedback/SplashScreen" :layout="{ type: 'single', iframe: true }">
    <Variant title="Interactive Preview">
      <div class="relative w-full h-[600px] bg-bg-base border border-border-default rounded-2xl overflow-hidden flex items-center justify-center">
        <!-- Application fictive sous le splash screen -->
        <div class="flex flex-col items-center gap-4 text-center p-8">
          <h2 class="text-2xl font-bold text-text-primary">Espace de Travail Incroyaux News Studio</h2>
          <p class="text-text-secondary max-w-md">
            L'application est chargée avec succès. Vous pouvez tester le cycle de chargement ci-dessous.
          </p>
          <button
            type="button"
            class="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-lg transition-all active:scale-95"
            @click="simulateLoad"
          >
            Relancer la simulation de chargement
          </button>
        </div>

        <!-- Composant SplashScreen -->
        <SplashScreen
          :is-loading="state.isLoading"
          :status-message="state.statusMessage"
          :progress="state.progress"
          :show-progress="state.showProgress"
          :min-duration-ms="state.minDurationMs"
          class="!absolute"
          @completed="() => {}"
        />
      </div>

      <template #controls>
        <HstCheckbox v-model="state.isLoading" title="Is Loading" />
        <HstText v-model="state.statusMessage" title="Status Message" />
        <HstNumber v-model="state.progress" title="Progress %" :min="0" :max="100" />
        <HstCheckbox v-model="state.showProgress" title="Show Progress Bar" />
        <HstNumber v-model="state.minDurationMs" title="Min Duration (ms)" :step="100" />
      </template>
    </Variant>
  </Story>
</template>
