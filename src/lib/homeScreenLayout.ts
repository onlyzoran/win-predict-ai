import { CATEGORY_SLIDER_LAYOUT_SHOWS_FILTERS } from '@onlyzoran/win-predict-ai-ui'

export const HOME_SCREEN_LAYOUTS = ['grid', 'category-slider'] as const

export type HomeScreenLayout = (typeof HOME_SCREEN_LAYOUTS)[number]

export function isHomeScreenLayout(value: string): value is HomeScreenLayout {
  return (HOME_SCREEN_LAYOUTS as readonly string[]).includes(value)
}

export function resolveHomeScreenLayout(): HomeScreenLayout {
  const raw = import.meta.env.VITE_HOME_SCREEN_LAYOUT?.trim()
  if (raw && isHomeScreenLayout(raw)) {
    return raw
  }

  return 'category-slider'
}

export function homeScreenLayoutShowsFilters(layout: HomeScreenLayout): boolean {
  if (layout === 'category-slider') {
    return CATEGORY_SLIDER_LAYOUT_SHOWS_FILTERS
  }

  return true
}
