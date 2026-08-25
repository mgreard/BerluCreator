import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@/components/ui': fileURLToPath(new URL('./src/ui/components/ui', import.meta.url)),
      '@/shared': fileURLToPath(new URL('./src/ui/shared', import.meta.url)),
      '@/styles': fileURLToPath(new URL('./src/ui/styles', import.meta.url)),
      '@/ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@infrastructure': fileURLToPath(new URL('./src/infrastructure', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    host: true
  }
})
