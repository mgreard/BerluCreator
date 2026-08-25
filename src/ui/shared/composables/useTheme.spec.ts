import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('useTheme', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.colorScheme = ''
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.colorScheme = ''
  })

  it("n'altère pas le thème du document lors du simple import", async () => {
    document.documentElement.setAttribute('data-theme', 'application-theme')
    localStorage.setItem('mycomplib-theme', 'light')

    await import('./useTheme')

    expect(document.documentElement.getAttribute('data-theme')).toBe('application-theme')
  })

  it("initialise le thème seulement lorsque le consommateur l'utilise", async () => {
    localStorage.setItem('mycomplib-theme', 'light')
    const { useTheme } = await import('./useTheme')

    const theme = useTheme()

    expect(theme.theme.value).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })
})
