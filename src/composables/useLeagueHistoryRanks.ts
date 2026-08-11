import { onMounted, ref, watch, type MaybeRefOrGetter, toValue } from 'vue'
import { fetchHistoryDaysOptional, fetchHistorySnapshot } from '@/lib/leagueData'
import { buildRankSeries, sampleHistoryDates, type RankSeries } from '@/lib/historyRank'
import type { LeagueManifest, TournamentLayout } from '@/types/league'

export type LeagueHistorySource = {
  id?: string
  layout?: TournamentLayout
  contestPath?: string
}

export function useLeagueHistoryRanks(source: MaybeRefOrGetter<LeagueHistorySource | undefined>) {
  const series = ref<RankSeries | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    const value = toValue(source)
    series.value = null
    error.value = null

    const leagueId = value?.id
    if (!leagueId) {
      isLoading.value = false
      return
    }

    const historySource: Pick<LeagueManifest, 'id' | 'layout' | 'contestPath'> = {
      id: leagueId,
      layout: value.layout,
      contestPath: value.contestPath,
    }

    isLoading.value = true

    try {
      const daysIndex = await fetchHistoryDaysOptional(historySource)
      if (!daysIndex || daysIndex.count <= 1 || daysIndex.days.length <= 1) {
        series.value = null
        return
      }

      const dates = sampleHistoryDates(daysIndex.days)
      const snapshots = await Promise.all(
        dates.map((date) => fetchHistorySnapshot(historySource, date)),
      )
      const built = buildRankSeries(snapshots)
      series.value = built.points.length > 1 ? built : null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load history'
      series.value = null
    } finally {
      isLoading.value = false
    }
  }

  onMounted(load)
  watch(
    () => {
      const value = toValue(source)
      return [value?.id, value?.layout, value?.contestPath] as const
    },
    load,
  )

  return {
    series,
    isLoading,
    error,
    reload: load,
  }
}
