import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { buildRankSeries, sampleHistoryDates, type RankSeries } from '@/lib/historyRank'
import type { LeagueManifest, TournamentLayout } from '@/types/league'
import { fetchHistoryDaysOptional, fetchHistorySnapshot } from '@/lib/leagueData'
import { STALE_TIME } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'

export type LeagueHistorySource = {
  id?: string
  layout?: TournamentLayout
  contestPath?: string
}

export function useLeagueHistoryRanks(source: MaybeRefOrGetter<LeagueHistorySource | undefined>) {
  const queryClient = useQueryClient()

  const historySource = computed(() => {
    const value = toValue(source)
    const leagueId = value?.id
    if (!leagueId) {
      return null
    }
    return {
      id: leagueId,
      layout: value.layout,
      contestPath: value.contestPath,
    } satisfies Pick<LeagueManifest, 'id' | 'layout' | 'contestPath'>
  })

  const daysQuery = useQuery({
    queryKey: computed(() =>
      historySource.value ? queryKeys.historyDays(historySource.value) : ['history-days', 'disabled'],
    ),
    queryFn: () => fetchHistoryDaysOptional(historySource.value!),
    staleTime: STALE_TIME.historyDays,
    enabled: computed(() => historySource.value !== null),
  })

  const sampledDates = computed(() => {
    const daysIndex = daysQuery.data.value
    if (!daysIndex || daysIndex.count <= 1 || daysIndex.days.length <= 1) {
      return [] as string[]
    }
    return sampleHistoryDates(daysIndex.days)
  })

  const snapshotsQuery = useQuery({
    queryKey: computed(() => {
      const src = historySource.value
      const dates = sampledDates.value
      if (!src || dates.length === 0) {
        return ['history-series', 'disabled'] as const
      }
      return ['history-series', src.id, src.layout ?? 'legacy', src.contestPath ?? '', ...dates] as const
    }),
    queryFn: async () => {
      const src = historySource.value!
      const dates = sampledDates.value
      const snapshots = await Promise.all(
        dates.map((date) =>
          queryClient.fetchQuery({
            queryKey: queryKeys.historySnapshot(src, date),
            queryFn: () => fetchHistorySnapshot(src, date),
            staleTime: STALE_TIME.historySnapshot,
          }),
        ),
      )
      const built = buildRankSeries(snapshots)
      return built.points.length > 1 ? built : null
    },
    staleTime: STALE_TIME.historySnapshot,
    enabled: computed(() => historySource.value !== null && sampledDates.value.length > 0),
  })

  const series = computed<RankSeries | null>(() => snapshotsQuery.data.value ?? null)
  const isLoading = computed(() => {
    if (historySource.value === null) {
      return false
    }
    if (daysQuery.isLoading.value || daysQuery.isFetching.value) {
      return true
    }
    if (
      sampledDates.value.length > 0 &&
      (snapshotsQuery.isLoading.value || snapshotsQuery.isFetching.value)
    ) {
      return true
    }
    return false
  })
  const error = computed(() => {
    const err = daysQuery.error.value ?? snapshotsQuery.error.value
    return err instanceof Error ? err.message : null
  })

  async function reload() {
    if (!historySource.value) {
      return
    }
    await queryClient.invalidateQueries({
      queryKey: queryKeys.historyDays(historySource.value),
    })
    await queryClient.invalidateQueries({
      queryKey: ['history-series'],
    })
  }

  return {
    series,
    isLoading,
    error,
    reload,
  }
}
