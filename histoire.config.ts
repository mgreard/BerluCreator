import { defineConfig } from 'histoire'
import { HstVue } from '@histoire/plugin-vue'

export default defineConfig({
  plugins: [HstVue()],
  setupFile: './src/ui/histoire.setup.ts',
  storyMatch: ['src/ui/**/*.story.vue']
})
