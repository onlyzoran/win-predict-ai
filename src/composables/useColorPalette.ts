import {
  DEFAULT_PALETTE,
  PALETTES,
  type Palette,
} from '@onlyzoran/win-predict-ai-ui'
import { useColorMode, useStorage } from '@vueuse/core'
import { computed, watch } from 'vue'

/** Nexora — пока не в PALETTES npm-пакета (Storybook-only в UI #37). */
export const NEXORA_PALETTE = 'nexora' as const

export type ColorPalette = Palette | typeof NEXORA_PALETTE

export interface PalettePreferences {
  light: ColorPalette
  dark: ColorPalette
}

export const COLOR_PALETTES: readonly ColorPalette[] = [...PALETTES, NEXORA_PALETTE]

/** Light/dark mode before the user toggles ThemeToggle (`vueuse-color-scheme`). */
export const DEFAULT_COLOR_SCHEME = 'auto' as const

/** Color palettes before the user opens /settings/appearance. */
export const DEFAULT_PALETTE_PREFERENCES: PalettePreferences = {
  light: DEFAULT_PALETTE,
  dark: DEFAULT_PALETTE,
}

export const PALETTE_STORAGE_KEY = 'color-palette-preferences'

export const palettePreferences = useStorage<PalettePreferences>(
  PALETTE_STORAGE_KEY,
  DEFAULT_PALETTE_PREFERENCES,
)

function isColorPalette(value: unknown): value is ColorPalette {
  return (COLOR_PALETTES as readonly string[]).includes(value as string)
}

export function normalizePalettePreferences(raw: unknown): PalettePreferences {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PALETTE_PREFERENCES }
  }

  const prefs = raw as Partial<PalettePreferences>
  return {
    light: isColorPalette(prefs.light) ? prefs.light : DEFAULT_PALETTE_PREFERENCES.light,
    dark: isColorPalette(prefs.dark) ? prefs.dark : DEFAULT_PALETTE_PREFERENCES.dark,
  }
}

export function resolveIsDark(mode: string): boolean {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyColorPalette(isDark: boolean, prefs: PalettePreferences) {
  const palette = isDark ? prefs.dark : prefs.light
  document.documentElement.setAttribute('data-palette', palette)
}

export function useColorPalette() {
  const mode = useColorMode()

  const isDark = computed(() => resolveIsDark(mode.value))

  const activePalette = computed((): ColorPalette =>
    isDark.value ? palettePreferences.value.dark : palettePreferences.value.light,
  )

  const isNexoraActive = computed(() => activePalette.value === NEXORA_PALETTE)

  watch(
    [isDark, palettePreferences],
    () => applyColorPalette(isDark.value, palettePreferences.value),
    { immediate: true, deep: true },
  )

  return { palettePreferences, isDark, mode, activePalette, isNexoraActive }
}
