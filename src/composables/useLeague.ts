import { onMounted, ref, watch, type MaybeRefOrGetter, toValue } from 'vue'
import type { League } from '@/types/league'
import { loadLeagueById } from '@/lib/leagueData'

export function useLeague(id: MaybeRefOrGetter<string>) {
  const league = ref<League | null>(null)
  const isLoading = ref(true)
  const notFound = ref(false)
  const loadError = ref<string | null>(null)

  async function load() {
    const leagueId = toValue(id)
    isLoading.value = true
    notFound.value = false
    loadError.value = null
    league.value = null

    try {
      const result = await loadLeagueById(leagueId)
      if (!result) {
        notFound.value = true
      } else {
        league.value = result
      }
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'Failed to load data'
    } finally {
      isLoading.value = false
    }
  }

  onMounted(load)
  watch(() => toValue(id), load)

  return {
    league,
    isLoading,
    notFound,
    loadError,
    reload: load,
  }
}
