import type { SortMode } from '@/types/sort'
import type { Sport } from '@/types/sport'

export interface FilterableTeam {
  name: string
}

export interface FilterableLeague {
  title: string
  teams: FilterableTeam[]
  endDate: string
}

export interface FilterableSlot {
  id: string
  sport: Sport
  popularPriority: number
  league: FilterableLeague | null
}

export function filterSlots<T extends FilterableSlot>(
  slots: T[],
  selectedSport: Sport | 'all',
  searchQuery: string,
): T[] {
  const query = searchQuery.trim().toLowerCase()

  return slots.filter((slot) => {
    if (selectedSport !== 'all' && slot.sport !== selectedSport) {
      return false
    }

    if (!query) {
      return true
    }

    if (!slot.league) {
      return false
    }

    if (slot.league.title.toLowerCase().includes(query)) {
      return true
    }

    return slot.league.teams.some((team) => team.name.toLowerCase().includes(query))
  })
}

export function compareSlots(
  a: FilterableSlot,
  b: FilterableSlot,
  sortMode: SortMode,
  locale: string,
) {
  if (sortMode === 'name') {
    if (!a.league && !b.league) return 0
    if (!a.league) return 1
    if (!b.league) return -1
    return a.league.title.localeCompare(b.league.title, locale)
  }

  if (sortMode === 'endingSoon') {
    if (!a.league && !b.league) return 0
    if (!a.league) return 1
    if (!b.league) return -1
    return a.league.endDate.localeCompare(b.league.endDate)
  }

  return a.popularPriority - b.popularPriority
}

export function sortSlotsWithPinned<T extends FilterableSlot>(
  slots: T[],
  pinnedIds: string[],
  sortMode: SortMode,
  locale: string,
): T[] {
  const pinnedSet = new Set(pinnedIds)
  const pinned: T[] = []
  const unpinned: T[] = []

  for (const slot of slots) {
    if (pinnedSet.has(slot.id)) {
      pinned.push(slot)
    } else {
      unpinned.push(slot)
    }
  }

  pinned.sort((a, b) => compareSlots(a, b, sortMode, locale))
  unpinned.sort((a, b) => compareSlots(a, b, sortMode, locale))

  return [...pinned, ...unpinned]
}

export function togglePinned(
  pinnedIds: string[],
  id: string,
  isCurrentlyPinned: boolean,
): string[] {
  if (isCurrentlyPinned) {
    return pinnedIds.filter((tournamentId) => tournamentId !== id)
  }

  return [...pinnedIds, id]
}
