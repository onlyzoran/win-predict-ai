import { QueryClient } from '@tanstack/vue-query'

/** staleTime aligned with docs/data-caching.md (variant B + data-repo cron). */
export const STALE_TIME = {
  manifest: 60_000,
  leaguePayload: 3 * 60 * 60 * 1000,
  sports: 20 * 60 * 1000,
  historyDays: 3 * 60 * 60 * 1000,
  historySnapshot: Number.POSITIVE_INFINITY,
} as const

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 2,
      },
    },
  })
}
