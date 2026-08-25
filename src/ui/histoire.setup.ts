import '@/styles/histoire.css'
import { defineSetupVue3 } from '@histoire/plugin-vue'

export const setupVue3 = defineSetupVue3(() => {})

// Histoire charge aussi son renderer vanilla intégré pendant le build.
export const setupVanilla = () => undefined
