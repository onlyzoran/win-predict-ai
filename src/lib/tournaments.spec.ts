import { describe, expect, it } from 'vitest'
import {
  compareSlots,
  filterSlots,
  sortSlotsWithPinned,
  togglePinned,
  type FilterableSlot,
} from './tournaments'

function slot(partial: Partial<FilterableSlot> & Pick<FilterableSlot, 'id'>): FilterableSlot {
  return {
    sport: 'football',
    popularPriority: 1,
    league: {
      title: 'Premier League',
      teams: [{ name: 'Arsenal' }, { name: 'Chelsea' }],
      endDate: '2026-05-01',
    },
    ...partial,
  }
}

describe('filterSlots', () => {
  const slots = [
    slot({
      id: 'epl',
      sport: 'football',
      league: {
        title: 'Premier League',
        teams: [{ name: 'Arsenal' }, { name: 'Chelsea' }],
        endDate: '2026-05-01',
      },
    }),
    slot({
      id: 'nba',
      sport: 'basketball',
      league: {
        title: 'NBA',
        teams: [{ name: 'Lakers' }, { name: 'Celtics' }],
        endDate: '2026-06-01',
      },
    }),
    slot({ id: 'pending', sport: 'hockey', league: null }),
  ]

  it('returns all slots when sport is all and search is empty', () => {
    expect(filterSlots(slots, 'all', '').map((s) => s.id)).toEqual(['epl', 'nba', 'pending'])
  })

  it('filters by sport', () => {
    expect(filterSlots(slots, 'basketball', '').map((s) => s.id)).toEqual(['nba'])
  })

  it('filters by tournament title', () => {
    expect(filterSlots(slots, 'all', 'premier').map((s) => s.id)).toEqual(['epl'])
  })

  it('filters by team name', () => {
    expect(filterSlots(slots, 'all', 'lakers').map((s) => s.id)).toEqual(['nba'])
  })

  it('hides pending slots when searching', () => {
    expect(filterSlots(slots, 'all', 'hockey').map((s) => s.id)).toEqual([])
  })

  it('combines sport and search filters', () => {
    expect(filterSlots(slots, 'football', 'arsenal').map((s) => s.id)).toEqual(['epl'])
    expect(filterSlots(slots, 'basketball', 'arsenal').map((s) => s.id)).toEqual([])
  })
})

describe('togglePinned', () => {
  it('pins a tournament', () => {
    expect(togglePinned(['epl'], 'nba', false)).toEqual(['epl', 'nba'])
  })

  it('unpins a tournament', () => {
    expect(togglePinned(['epl', 'nba'], 'epl', true)).toEqual(['nba'])
  })
})

describe('sortSlotsWithPinned', () => {
  const slots = [
    slot({
      id: 'b',
      popularPriority: 2,
      league: { title: 'Bravo Cup', teams: [], endDate: '2026-08-01' },
    }),
    slot({
      id: 'a',
      popularPriority: 1,
      league: { title: 'Alpha Cup', teams: [], endDate: '2026-09-01' },
    }),
    slot({
      id: 'c',
      popularPriority: 3,
      league: { title: 'Charlie Cup', teams: [], endDate: '2026-07-01' },
    }),
  ]

  it('keeps pinned tournaments first while sorting within groups', () => {
    expect(sortSlotsWithPinned(slots, ['c'], 'popular', 'en').map((s) => s.id)).toEqual([
      'c',
      'a',
      'b',
    ])
  })

  it('sorts by name', () => {
    expect(sortSlotsWithPinned(slots, [], 'name', 'en').map((s) => s.id)).toEqual(['a', 'b', 'c'])
  })

  it('sorts by ending soon', () => {
    expect(sortSlotsWithPinned(slots, [], 'endingSoon', 'en').map((s) => s.id)).toEqual([
      'c',
      'b',
      'a',
    ])
  })
})

describe('compareSlots', () => {
  it('puts unloaded leagues after loaded ones for name and endingSoon', () => {
    const loaded = slot({ id: 'loaded' })
    const pending = slot({ id: 'pending', league: null })

    expect(compareSlots(pending, loaded, 'name', 'en')).toBe(1)
    expect(compareSlots(loaded, pending, 'endingSoon', 'en')).toBe(-1)
  })
})
