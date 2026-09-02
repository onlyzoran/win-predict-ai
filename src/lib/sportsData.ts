import { FALLBACK_SPORTS, type SportCatalogItem } from '@/types/sport'

const SPORTS_URL = (import.meta.env.VITE_SPORTS_URL ?? '').replace(/\/$/, '')

export async function fetchSportsCatalog(): Promise<SportCatalogItem[]> {
  if (!SPORTS_URL) {
    throw new Error('VITE_SPORTS_URL is not set')
  }

  const res = await fetch(SPORTS_URL, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Failed to load sports catalog: ${res.status}`)
  }

  const data: unknown = await res.json()
  if (!Array.isArray(data)) {
    throw new Error('Invalid sports catalog payload')
  }

  return data as SportCatalogItem[]
}

export function resolveSportsCatalog(items: SportCatalogItem[]): SportCatalogItem[] {
  return items
    .filter((item) => item.isEnabled !== false && Boolean(item.slug))
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

/** Adds FALLBACK_SPORTS entries missing from a successful API response (e.g. prod lag). */
export function mergeWithFallbackSports(items: SportCatalogItem[]): SportCatalogItem[] {
  const bySlug = new Map(items.map((item) => [item.slug, item]))

  for (const fallback of FALLBACK_SPORTS) {
    if (!bySlug.has(fallback.slug)) {
      bySlug.set(fallback.slug, fallback)
    }
  }

  return resolveSportsCatalog([...bySlug.values()])
}

export function getFallbackSportsCatalog(): SportCatalogItem[] {
  return resolveSportsCatalog(FALLBACK_SPORTS)
}
