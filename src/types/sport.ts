/** Sport slug from the admin catalog API (e.g. `football`). */
export type Sport = string

export interface SportCatalogItem {
  id: string
  slug: string
  label: string
  iconKey: string
  sortOrder: number
  isEnabled: boolean
  createdAt?: string
  updatedAt?: string
}

/** Used when the sports catalog request fails. */
export const FALLBACK_SPORTS: SportCatalogItem[] = [
  { id: 'football', slug: 'football', label: 'Football', iconKey: 'football', sortOrder: 10, isEnabled: true },
  { id: 'basketball', slug: 'basketball', label: 'Basketball', iconKey: 'basketball', sortOrder: 20, isEnabled: true },
  {
    id: 'americanFootball',
    slug: 'americanFootball',
    label: 'American Football',
    iconKey: 'americanFootball',
    sortOrder: 30,
    isEnabled: true,
  },
  { id: 'hockey', slug: 'hockey', label: 'Hockey', iconKey: 'hockey', sortOrder: 40, isEnabled: true },
  { id: 'baseball', slug: 'baseball', label: 'Baseball', iconKey: 'baseball', sortOrder: 50, isEnabled: true },
  { id: 'motorsport', slug: 'motorsport', label: 'Motorsport', iconKey: 'motorsport', sortOrder: 60, isEnabled: true },
  { id: 'golf', slug: 'golf', label: 'Golf', iconKey: 'golf', sortOrder: 70, isEnabled: true },
  { id: 'politics', slug: 'politics', label: 'Politics', iconKey: 'politics', sortOrder: 80, isEnabled: true },
  { id: 'tennis', slug: 'tennis', label: 'Tennis', iconKey: 'tennis', sortOrder: 90, isEnabled: true },
  { id: 'mma', slug: 'mma', label: 'MMA', iconKey: 'mma', sortOrder: 100, isEnabled: true },
  { id: 'rugby', slug: 'rugby', label: 'Rugby', iconKey: 'rugby', sortOrder: 110, isEnabled: true },
  { id: 'cricket', slug: 'cricket', label: 'Cricket', iconKey: 'football', sortOrder: 120, isEnabled: true },
]
