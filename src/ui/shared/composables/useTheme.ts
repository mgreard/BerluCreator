import { ref, computed, type Ref, type ComputedRef } from 'vue'

export type Theme = 'dark' | 'light'

const THEME_STORAGE_KEY = 'mycomplib-theme'

const currentTheme = ref<Theme>('dark')

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'

  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light'
    }
  } catch {
    // Gestion du cas où localStorage est inaccessible
  }

  return 'dark'
}

function applyThemeToDOM(theme: Theme) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  if (theme === 'light') {
    root.classList.remove('dark')
    root.classList.add('light')
    root.setAttribute('data-theme', 'light')
    root.style.colorScheme = 'light'
  } else {
    root.classList.remove('light')
    root.classList.add('dark')
    root.setAttribute('data-theme', 'dark')
    root.style.colorScheme = 'dark'
  }
}

let isClientInitialized = false

function initThemeClient() {
  if (typeof window === 'undefined' || isClientInitialized) return
  isClientInitialized = true
  currentTheme.value = getInitialTheme()
  applyThemeToDOM(currentTheme.value)
}

export interface UseThemeReturn {
  theme: Ref<Theme>
  isDark: ComputedRef<boolean>
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export function useTheme(): UseThemeReturn {
  if (typeof window !== 'undefined' && !isClientInitialized) {
    initThemeClient()
  }

  const isDark = computed(() => currentTheme.value === 'dark')

  function setTheme(theme: Theme) {
    currentTheme.value = theme
    applyThemeToDOM(theme)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(THEME_STORAGE_KEY, theme)
      }
    } catch {
      // Ignorer erreur de stockage en environnement sandbox/privé
    }
  }

  function toggleTheme() {
    const nextTheme: Theme = currentTheme.value === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }

  return {
    theme: currentTheme,
    isDark,
    setTheme,
    toggleTheme
  }
}
