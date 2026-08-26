import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  eslintConfigPrettier,
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'dexie',
              message:
                'Les composants Vue ne doivent pas importer directement Dexie. Utilisez les stores Pinia, services applicatifs ou composables.'
            }
          ],
          patterns: [
            {
              group: ['@/infrastructure/**', '**/infrastructure/**'],
              message:
                'Les composants Vue ne doivent pas importer directement la couche infrastructure. Utilisez les stores Pinia, services applicatifs ou composables.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['src/App.vue', 'src/features/**/*.vue'],
    rules: {
      'vue/no-restricted-html-elements': [
        'error',
        {
          element: 'button',
          message: 'Utilisez Button ou IconButton depuis la librairie UI.'
        },
        {
          element: 'input',
          message: 'Utilisez Input depuis la librairie UI, sauf input fichier natif documenté.'
        },
        { element: 'textarea', message: 'Utilisez Textarea depuis la librairie UI.' },
        { element: 'select', message: 'Utilisez Select depuis la librairie UI.' },
        { element: 'h1', message: 'Utilisez Heading depuis la librairie UI.' },
        { element: 'h2', message: 'Utilisez Heading depuis la librairie UI.' },
        { element: 'h3', message: 'Utilisez Heading depuis la librairie UI.' },
        { element: 'h4', message: 'Utilisez Heading depuis la librairie UI.' },
        { element: 'h5', message: 'Utilisez Heading depuis la librairie UI.' },
        { element: 'h6', message: 'Utilisez Heading depuis la librairie UI.' },
        { element: 'p', message: 'Utilisez Text ou EmptyState depuis la librairie UI.' },
        { element: 'label', message: 'Utilisez FormGroup depuis la librairie UI.' }
      ]
    }
  },
  {
    files: ['*.config.ts', '*.config.js', 'e2e/**/*.ts', 'server/**/*.ts'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly'
      }
    }
  },
  {
    ignores: [
      'dist/**',
      'dist-server/**',
      'node_modules/**',
      'coverage/**',
      '.vite/**',
      '*.d.ts',
      '**/*.d.ts',
      '.agents/**',
      'packages/**'
    ]
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'error'
    }
  }
)
