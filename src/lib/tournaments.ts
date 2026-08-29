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
  sortTitle?: string
  sortEndDate?: string
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

    const title = slot.league?.title ?? slot.sortTitle
    if (title?.toLowerCase().includes(query)) {
      return true
    }

    if (!slot.league) {
      return false
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
    const aTitle = a.league?.title ?? a.sortTitle
    const bTitle = b.league?.title ?? b.sortTitle
    if (!aTitle && !bTitle) return 0
    if (!aTitle) return 1
    if (!bTitle) return -1
    return aTitle.localeCompare(bTitle, locale)
  }

  if (sortMode === 'endingSoon') {
    const aEndDate = a.league?.endDate ?? a.sortEndDate
    const bEndDate = b.league?.endDate ?? b.sortEndDate
    if (!aEndDate && !bEndDate) return 0
    if (!aEndDate) return 1
    if (!bEndDate) return -1
    return aEndDate.localeCompare(bEndDate)
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

export function toggleHidden(
  hiddenIds: string[],
  id: string,
  isCurrentlyHidden: boolean,
): string[] {
  if (isCurrentlyHidden) {
    return hiddenIds.filter((tournamentId) => tournamentId !== id)
  }

  return [...hiddenIds, id]
}

export function excludeHiddenSlots<T extends { id: string }>(slots: T[], hiddenIds: string[]): T[] {
  if (hiddenIds.length === 0) {
    return slots
  }

  const hiddenSet = new Set(hiddenIds)
  return slots.filter((slot) => !hiddenSet.has(slot.id))
}

export function slotIdsForLoading(slots: Array<{ id: string }>, hiddenIds: string[]): string[] {
  return excludeHiddenSlots(slots, hiddenIds).map((slot) => slot.id)
}
