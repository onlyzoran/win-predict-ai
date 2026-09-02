import { describe, expect, it } from 'vitest'
import { mergeWithFallbackSports } from './sportsData'
import type { SportCatalogItem } from '@/types/sport'

describe('mergeWithFallbackSports', () => {
  it('keeps API items and adds missing fallback slugs', () => {
    const apiItems: SportCatalogItem[] = [
      { id: 'football', slug: 'football', label: 'Football', iconKey: 'football', sortOrder: 10, isEnabled: true },
    ]

    const merged = mergeWithFallbackSports(apiItems)
    const slugs = merged.map((item) => item.slug)

    expect(slugs).toContain('football')
    expect(slugs).toContain('tennis')
    expect(slugs).toContain('mma')
    expect(slugs).toContain('rugby')
    expect(slugs).toContain('cricket')
    expect(slugs.length).toBeGreaterThan(1)
  })

  it('does not override API entries when slug is present', () => {
    const apiItems: SportCatalogItem[] = [
      { id: 'tennis', slug: 'tennis', label: 'Tennis API', iconKey: 'tennis', sortOrder: 5, isEnabled: true },
    ]

    const merged = mergeWithFallbackSports(apiItems)
    const tennis = merged.find((item) => item.slug === 'tennis')

    expect(tennis?.label).toBe('Tennis API')
    expect(tennis?.sortOrder).toBe(5)
  })
})
