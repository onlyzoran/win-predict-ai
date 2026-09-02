import type { CategorySliderCategory } from '@onlyzoran/win-predict-ai-ui'
import { sortSlotsWithPinned } from '@/lib/tournaments'
import type { LeagueSlot } from '@/types/league'
import type { SortMode } from '@/types/sort'
import type { SportCatalogItem } from '@/types/sport'

export function buildCategorySliderCategories(
  slots: LeagueSlot[],
  sportsCatalog: SportCatalogItem[],
  pinnedIds: string[],
  sortMode: SortMode,
  locale: string,
  sportLabel: (slug: string, apiLabel: string) => string,
): CategorySliderCategory<LeagueSlot>[] {
  const sorted = sortSlotsWithPinned(slots, pinnedIds, sortMode, locale)
  const sortOrderBySlug = new Map(sportsCatalog.map((item) => [item.slug, item.sortOrder]))
  const labelBySlug = new Map(
    sportsCatalog.map((item) => [item.slug, sportLabel(item.slug, item.label)]),
  )

  const slotsBySport = new Map<string, LeagueSlot[]>()
  for (const slot of sorted) {
    const group = slotsBySport.get(slot.sport) ?? []
    group.push(slot)
    slotsBySport.set(slot.sport, group)
  }

  return [...slotsBySport.entries()]
    .sort(([leftSlug], [rightSlug]) => {
      const leftOrder = sortOrderBySlug.get(leftSlug) ?? Number.MAX_SAFE_INTEGER
      const rightOrder = sortOrderBySlug.get(rightSlug) ?? Number.MAX_SAFE_INTEGER
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder
      }

      return leftSlug.localeCompare(rightSlug, locale)
    })
    .map(([slug, items]) => ({
      id: slug,
      title: labelBySlug.get(slug) ?? slug,
      items,
    }))
}
