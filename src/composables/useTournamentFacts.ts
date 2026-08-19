import { onMounted, ref, watch, type MaybeRefOrGetter, toValue } from 'vue'
import { loadTournamentFactsOptional } from '@/lib/leagueData'
import type { TournamentFactsSnapshot, TournamentLayout } from '@/types/league'

export type TournamentFactsSource = {
  id?: string
  layout?: TournamentLayout
  contestPath?: string
}

export function useTournamentFacts(source: MaybeRefOrGetter<TournamentFactsSource | undefined>) {
  const snapshot = ref<TournamentFactsSnapshot | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    const value = toValue(source)
    snapshot.value = null
    error.value = null

    const leagueId = value?.id
    if (!leagueId) {
      isLoading.value = false
      return
    }

    isLoading.value = true

    try {
      snapshot.value = await loadTournamentFactsOptional({
        id: leagueId,
        layout: value.layout,
        contestPath: value.contestPath,
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load facts'
      snapshot.value = null
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
    snapshot,
    isLoading,
    error,
    reload: load,
  }
}
