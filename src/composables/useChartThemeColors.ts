import { computed } from 'vue'
import { useColorPalette } from '@/composables/useColorPalette'

/** Bumps when active palette or color mode changes so charts re-resolve CSS vars. */
export function useChartThemeRevision() {
  const { isDark, palettePreferences } = useColorPalette()

  return computed(() => {
    const palette = isDark.value ? palettePreferences.value.dark : palettePreferences.value.light
    return `${palette}-${isDark.value ? 'dark' : 'light'}`
  })
}
