import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import type { League } from '@/types/league'
import { fetchLeague } from '@/lib/dataQueries'
import { STALE_TIME } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'

export function useLeague(id: MaybeRefOrGetter<string>) {
  const queryClient = useQueryClient()
  const leagueId = computed(() => toValue(id))

  const query = useQuery({
    queryKey: computed(() => queryKeys.league(leagueId.value)),
    queryFn: () => fetchLeague(queryClient, leagueId.value),
    staleTime: STALE_TIME.leaguePayload,
    enabled: computed(() => Boolean(leagueId.value)),
  })

  const league = computed<League | null>(() => query.data.value ?? null)
  const isLoading = computed(() => query.isLoading.value)
  const notFound = computed(
    () =>
      Boolean(leagueId.value) &&
      !isLoading.value &&
      !query.isError.value &&
      query.data.value === null,
  )
  const loadError = computed(() =>
    query.error.value instanceof Error ? query.error.value.message : null,
  )

  async function reload() {
    await query.refetch()
  }

  return {
    league,
    isLoading,
    notFound,
    loadError,
    reload,
  }
}
