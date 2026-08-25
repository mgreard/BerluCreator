import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'

const repositoryRoot = process.cwd()

function readRepositoryFile(relativePath: string) {
  return readFileSync(resolve(repositoryRoot, relativePath), 'utf8')
}

describe('UI library theme contract', () => {
  it('loads the packaged CSS and application styles', () => {
    const mainSource = readRepositoryFile('src/main.ts')
    const stylesImportIndex = mainSource.indexOf("@/styles/index.css")
    const applicationImportIndex = mainSource.indexOf("@/assets/styles/main.css")

    expect(stylesImportIndex).toBeGreaterThanOrEqual(0)
    expect(applicationImportIndex).toBeGreaterThan(stylesImportIndex)
  })

  it('ships dark as the initial document theme', () => {
    expect(readRepositoryFile('index.html')).toContain('data-theme="dark"')
  })

  it('defines restrained light glass and semantic inset surfaces', () => {
    const tokensSource = readRepositoryFile('src/assets/styles/tokens.css')

    expect(tokensSource).toContain('--color-bg-surface: #ffffff;')
    expect(tokensSource).toContain('--color-bg-surface-inset: #f1f3f7;')
    expect(tokensSource).toContain('--glass-bg: rgba(255, 255, 255, 0.34);')
    expect(tokensSource).toContain('--radius-card: var(--radius-lg);')
  })

  it('maps every library-only semantic token used by the dark application theme', () => {
    const bridgeSource = readRepositoryFile('src/assets/styles/ui-library-theme.css')
    const expectedTokens = [
      '--color-primary-active',
      '--color-primary-subtle',
      '--color-bg-glass',
      '--color-border-default',
      '--shadow-glass-xs',
      '--shadow-glass-sm',
      '--shadow-glass-md',
      '--shadow-glass-lg',
      '--shadow-glass-xl',
      '--shadow-glass-2xl'
    ]

    for (const token of expectedTokens) {
      expect(bridgeSource).toContain(`${token}:`)
    }

    expect(bridgeSource).not.toContain('--mcl-')
  })
})
