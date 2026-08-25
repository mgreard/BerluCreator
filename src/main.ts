import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// Import de la feuille de style Tailwind CSS v4 & @theme OKLCH
import '@/styles/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
