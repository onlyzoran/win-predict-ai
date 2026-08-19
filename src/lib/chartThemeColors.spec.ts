import { afterEach, describe, expect, it } from 'vitest'
import {
  CHART_COLORS,
  getOthersChartColor,
  getOthersChartColorToken,
  getTeamChartColor,
  readOthersChartColor,
  readTopChartColors,
  TOP_CHART_COLOR_TOKENS,
} from './chartThemeColors'

const LEGACY_GREEN_RAMP = [
  'oklch(0.82 0.14 160)',
  'oklch(0.72 0.15 160)',
  'oklch(0.62 0.14 160)',
  'oklch(0.52 0.12 160)',
  'oklch(0.42 0.10 160)',
]

const PALETTE_THEME_VARS = {
  'slate-teal-light': {
    '--chart-1': 'oklch(0.52 0.14 195)',
    '--chart-2': 'oklch(0.62 0.16 55)',
    '--chart-3': 'oklch(0.55 0.18 285)',
    '--chart-4': 'oklch(0.58 0.17 25)',
    '--chart-5': 'oklch(0.52 0.14 145)',
    '--muted': 'oklch(0.945 0.012 235)',
    '--muted-foreground': 'oklch(0.46 0.022 235)',
  },
  'slate-teal-dark': {
    '--chart-1': 'oklch(0.72 0.12 195)',
    '--chart-2': 'oklch(0.78 0.14 55)',
    '--chart-3': 'oklch(0.7 0.16 285)',
    '--chart-4': 'oklch(0.72 0.15 25)',
    '--chart-5': 'oklch(0.72 0.13 145)',
    '--muted': 'oklch(0.26 0.024 235)',
    '--muted-foreground': 'oklch(0.68 0.022 235)',
  },
  'claude-plus-light': {
    '--chart-1': 'oklch(0.5583 0.1276 42.9956)',
    '--chart-2': 'oklch(0.6898 0.1581 290.4107)',
    '--chart-3': 'oklch(0.8816 0.0276 93.1280)',
    '--chart-4': 'oklch(0.8822 0.0403 298.1792)',
    '--chart-5': 'oklch(0.5608 0.1348 42.0584)',
    '--muted': 'oklch(0.9341 0.0153 90.2390)',
    '--muted-foreground': 'oklch(0.5341 0.0078 97.4503)',
  },
  'claude-plus-dark': {
    '--chart-1': 'oklch(0.5583 0.1276 42.9956)',
    '--chart-2': 'oklch(0.6898 0.1581 290.4107)',
    '--chart-3': 'oklch(0.2130 0.0078 95.4245)',
    '--chart-4': 'oklch(0.3074 0.0516 289.3230)',
    '--chart-5': 'oklch(0.5608 0.1348 42.0584)',
    '--muted': 'oklch(0.2213 0.0038 106.7070)',
    '--muted-foreground': 'oklch(0.7713 0.0169 99.0657)',
  },
  'zinc-light': {
    '--chart-1': 'oklch(0.646 0.222 41.116)',
    '--chart-2': 'oklch(0.6 0.118 184.704)',
    '--chart-3': 'oklch(0.398 0.07 227.392)',
    '--chart-4': 'oklch(0.828 0.189 84.429)',
    '--chart-5': 'oklch(0.769 0.188 70.08)',
    '--muted': 'oklch(0.967 0.001 286.375)',
    '--muted-foreground': 'oklch(0.552 0.016 285.938)',
  },
  'zinc-dark': {
    '--chart-1': 'oklch(0.488 0.243 264.376)',
    '--chart-2': 'oklch(0.696 0.17 162.48)',
    '--chart-3': 'oklch(0.769 0.188 70.08)',
    '--chart-4': 'oklch(0.627 0.265 303.9)',
    '--chart-5': 'oklch(0.645 0.246 16.439)',
    '--muted': 'oklch(0.274 0.006 286.033)',
    '--muted-foreground': 'oklch(0.705 0.015 286.067)',
  },
} as const

function applyThemeVars(themeKey: keyof typeof PALETTE_THEME_VARS) {
  const vars = PALETTE_THEME_VARS[themeKey]
  for (const [token, value] of Object.entries(vars)) {
    document.documentElement.style.setProperty(token, value)
  }
}

describe('chartThemeColors', () => {
  afterEach(() => {
    for (const token of [...TOP_CHART_COLOR_TOKENS, '--muted', '--muted-foreground']) {
      document.documentElement.style.removeProperty(token)
    }
    document.documentElement.classList.remove('dark')
  })

  describe('getTeamChartColor', () => {
    it('returns theme chart CSS variables for top teams only', () => {
      expect(getTeamChartColor(0)).toBe('var(--chart-1)')
      expect(getTeamChartColor(4)).toBe('var(--chart-5)')
      expect(getTeamChartColor(5)).toBeUndefined()
    })

    it('does not use the legacy monochrome green ramp', () => {
      expect(CHART_COLORS).not.toEqual(LEGACY_GREEN_RAMP)
      expect(CHART_COLORS.every((color) => color.startsWith('var(--chart-'))).toBe(true)
      expect(getOthersChartColor(false)).toBe('var(--muted-foreground)')
      expect(getOthersChartColor(true)).toBe('var(--muted)')
    })
  })

  describe.each([
    ['slate-teal-light', 'slate-teal', false],
    ['slate-teal-dark', 'slate-teal', true],
    ['claude-plus-light', 'claude-plus', false],
    ['claude-plus-dark', 'claude-plus', true],
  ] as const)('palette %s', (themeKey, palette, dark) => {
    it('reads five distinct chart colors without green hue 160', () => {
      applyThemeVars(themeKey)
      document.documentElement.setAttribute('data-palette', palette)
      document.documentElement.classList.toggle('dark', dark)

      const colors = readTopChartColors()
      const expected = TOP_CHART_COLOR_TOKENS.map(
        (token) => PALETTE_THEME_VARS[themeKey][token as keyof (typeof PALETTE_THEME_VARS)[typeof themeKey]],
      )

      expect(colors).toEqual(expected)
      expect(new Set(colors).size).toBe(TOP_CHART_COLOR_TOKENS.length)
      expect(colors.every((color) => !color.includes('160'))).toBe(true)
      expect(colors).not.toEqual(LEGACY_GREEN_RAMP)
    })

    it('reads a muted Others color from the active palette', () => {
      applyThemeVars(themeKey)
      document.documentElement.classList.toggle('dark', dark)

      const othersToken = getOthersChartColorToken(dark)
      expect(readOthersChartColor()).toBe(PALETTE_THEME_VARS[themeKey][othersToken as '--muted' | '--muted-foreground'])
      expect(readOthersChartColor()).not.toBe('oklch(0.34 0.07 160)')
    })
  })

  describe.each(['slate-teal-dark', 'claude-plus-dark'] as const)(
    'dark Others color %s',
    (themeKey) => {
    it('uses muted surface instead of light muted-foreground', () => {
      applyThemeVars(themeKey)
      document.documentElement.classList.add('dark')

      expect(readOthersChartColor()).toBe(PALETTE_THEME_VARS[themeKey]['--muted'])
      expect(readOthersChartColor()).not.toBe(PALETTE_THEME_VARS[themeKey]['--muted-foreground'])
    })
  })

  describe.each([
    ['zinc-light', 'zinc', false],
    ['zinc-dark', 'zinc', true],
  ] as const)('palette %s', (themeKey, palette, dark) => {
    it('keeps readable chart tokens without the legacy green ramp', () => {
      applyThemeVars(themeKey)
      document.documentElement.setAttribute('data-palette', palette)
      document.documentElement.classList.toggle('dark', dark)

      const colors = readTopChartColors()
      expect(colors.every((color) => color.length > 0)).toBe(true)
      expect(colors).not.toEqual(LEGACY_GREEN_RAMP)
    })
  })
})
