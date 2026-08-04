import { onMounted, ref, watch, type MaybeRefOrGetter, toValue } from 'vue'
import { fetchHistoryDaysOptional, fetchHistorySnapshot } from '@/lib/leagueData'
import { buildRankSeries, sampleHistoryDates, type RankSeries } from '@/lib/historyRank'

export function useLeagueHistoryRanks(id: MaybeRefOrGetter<string | undefined>) {
  const series = ref<RankSeries | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    const leagueId = toValue(id)
    series.value = null
    error.value = null

    if (!leagueId) {
      isLoading.value = false
      return
    }

    isLoading.value = true

    try {
      const daysIndex = await fetchHistoryDaysOptional(leagueId)
      if (!daysIndex || daysIndex.count <= 1 || daysIndex.days.length <= 1) {
        series.value = null
        return
      }

      const dates = sampleHistoryDates(daysIndex.days)
      const snapshots = await Promise.all(dates.map((date) => fetchHistorySnapshot(leagueId, date)))
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
  watch(() => toValue(id), load)

  return {
    series,
    isLoading,
    error,
    reload: load,
  }
}
