import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import {
  fetchSportsCatalog,
  getFallbackSportsCatalog,
  mergeWithFallbackSports,
} from '@/lib/sportsData'
import { STALE_TIME } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'

export function useSports() {
  const query = useQuery({
    queryKey: queryKeys.sports,
    queryFn: async () => mergeWithFallbackSports(await fetchSportsCatalog()),
    staleTime: STALE_TIME.sports,
    placeholderData: () => getFallbackSportsCatalog(),
    retry: 1,
  })

  const sports = computed(() => {
    if (query.isError.value) {
      return getFallbackSportsCatalog()
    }
    return query.data.value ?? getFallbackSportsCatalog()
  })

  const isLoading = computed(() => query.isLoading.value)
  const loadError = computed(() =>
    query.isError.value && query.error.value instanceof Error
      ? query.error.value.message
      : null,
  )

  return {
    sports,
    isLoading,
    loadError,
  }
}
