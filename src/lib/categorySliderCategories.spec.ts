import { describe, expect, it } from 'vitest'
import { buildCategorySliderCategories } from '@/lib/categorySliderCategories'
import type { LeagueSlot } from '@/types/league'

function slot(partial: Partial<LeagueSlot> & Pick<LeagueSlot, 'id' | 'sport'>): LeagueSlot {
  return {
    popularPriority: 0,
    sortTitle: partial.id,
    sortEndDate: '2026-12-31',
    league: null,
    ...partial,
  }
}

describe('buildCategorySliderCategories', () => {
  const sportsCatalog = [
    { id: 'football', slug: 'football', label: 'Football', iconKey: 'football', sortOrder: 10, isEnabled: true },
    { id: 'basketball', slug: 'basketball', label: 'Basketball', iconKey: 'basketball', sortOrder: 20, isEnabled: true },
  ]

  it('groups slots by sport and orders categories by catalog sortOrder', () => {
    const slots = [
      slot({ id: 'nba', sport: 'basketball', popularPriority: 2 }),
      slot({ id: 'epl', sport: 'football', popularPriority: 1 }),
    ]

    const categories = buildCategorySliderCategories(
      slots,
      sportsCatalog,
      [],
      'popular',
      'en',
      (_slug, label) => label,
    )

    expect(categories.map((category) => category.id)).toEqual(['football', 'basketball'])
    expect(categories[0]?.items.map((item) => item.id)).toEqual(['epl'])
    expect(categories[1]?.items.map((item) => item.id)).toEqual(['nba'])
  })

  it('sorts tournaments inside a category', () => {
    const slots = [
      slot({ id: 'nba', sport: 'basketball', popularPriority: 20 }),
      slot({ id: 'wnba', sport: 'basketball', popularPriority: 10 }),
    ]

    const categories = buildCategorySliderCategories(
      slots,
      sportsCatalog,
      [],
      'popular',
      'en',
      (_slug, label) => label,
    )

    expect(categories[0]?.items.map((item) => item.id)).toEqual(['wnba', 'nba'])
  })
})
