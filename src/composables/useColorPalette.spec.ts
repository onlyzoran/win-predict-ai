import { afterEach, describe, expect, it } from 'vitest'
import {
  COLOR_PALETTES,
  applyColorPalette,
  normalizePalettePreferences,
  resolveIsDark,
} from './useColorPalette'

describe('useColorPalette', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-palette')
    document.documentElement.classList.remove('dark')
  })

  it('includes pastel in supported palettes', () => {
    expect(COLOR_PALETTES).toContain('pastel')
  })

  it('normalizes pastel preferences', () => {
    expect(
      normalizePalettePreferences({
        light: 'pastel',
        dark: 'pastel',
      }),
    ).toEqual({
      light: 'pastel',
      dark: 'pastel',
    })
  })

  it('applies pastel palette attribute on document root', () => {
    applyColorPalette(false, { light: 'pastel', dark: 'zinc' })
    expect(document.documentElement.getAttribute('data-palette')).toBe('pastel')
  })

  it('applies pastel in dark mode', () => {
    applyColorPalette(true, { light: 'zinc', dark: 'pastel' })
    expect(document.documentElement.getAttribute('data-palette')).toBe('pastel')
  })

  it('resolves explicit light and dark modes', () => {
    expect(resolveIsDark('light')).toBe(false)
    expect(resolveIsDark('dark')).toBe(true)
  })
})
