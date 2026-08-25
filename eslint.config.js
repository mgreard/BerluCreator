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
