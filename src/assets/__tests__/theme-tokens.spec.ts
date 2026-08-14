import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const themeTokensCss = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../theme-tokens.css'),
  'utf8',
)

const REQUIRED_TOKENS = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--destructive',
  '--border',
  '--input',
  '--ring',
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
  '--sidebar',
  '--sidebar-foreground',
  '--sidebar-primary',
  '--sidebar-primary-foreground',
  '--sidebar-accent',
  '--sidebar-accent-foreground',
  '--sidebar-border',
  '--sidebar-ring',
] as const

function extractBlock(css: string, selector: ':root' | '.dark'): string {
  const match = css.match(new RegExp(`${selector.replace('.', '\\.')}\\s*\\{([^}]+)\\}`, 's'))
  expect(match, `missing ${selector} block`).toBeTruthy()
  return match![1]!
}

describe('theme-tokens.css', () => {
  it('defines light and dark semantic token blocks', () => {
    const light = extractBlock(themeTokensCss, ':root')
    const dark = extractBlock(themeTokensCss, '.dark')

    for (const token of REQUIRED_TOKENS) {
      expect(light, `${token} in :root`).toMatch(new RegExp(`${token}:`))
      expect(dark, `${token} in .dark`).toMatch(new RegExp(`${token}:`))
    }
  })
})
