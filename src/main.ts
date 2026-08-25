import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// Import de la feuille de style Tailwind CSS v4 & @theme OKLCH
import '@/styles/index.css'

// Import des styles et tokens du projet applicatif (Dark Ambient Glow & Composants)
import '@/assets/styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
