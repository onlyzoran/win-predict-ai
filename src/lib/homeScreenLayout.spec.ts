import { describe, expect, it } from 'vitest'
import {
  homeScreenLayoutShowsFilters,
  isHomeScreenLayout,
  resolveHomeScreenLayout,
} from '@/lib/homeScreenLayout'

describe('homeScreenLayout', () => {
  it('recognizes supported layouts', () => {
    expect(isHomeScreenLayout('grid')).toBe(true)
    expect(isHomeScreenLayout('category-slider')).toBe(true)
    expect(isHomeScreenLayout('unknown')).toBe(false)
  })

  it('defaults to category-slider layout', () => {
    expect(resolveHomeScreenLayout()).toBe('category-slider')
  })

  it('hides filters for category-slider layout', () => {
    expect(homeScreenLayoutShowsFilters('category-slider')).toBe(false)
    expect(homeScreenLayoutShowsFilters('grid')).toBe(true)
  })
})
