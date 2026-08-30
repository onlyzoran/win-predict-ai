import { computed, ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import type { LeagueManifest, LeagueSlot } from '@/types/league'
import { fetchLeaguesManifest, toSlot } from '@/lib/leagueData'
import { fetchLeagueCardTeams, toLeagueCard } from '@/lib/dataQueries'
import { STALE_TIME } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'

const INITIAL_BATCH_SIZE = 12

export function useLeagues() {
  const queryClient = useQueryClient()

  const manifestQuery = useQuery({
    queryKey: queryKeys.manifest,
    queryFn: () => fetchLeaguesManifest<LeagueManifest[]>(),
    staleTime: STALE_TIME.manifest,
  })

  const configs = computed(() => manifestQuery.data.value ?? [])
  const isManifestLoading = computed(() => manifestQuery.isLoading.value)
  const loadError = computed(() =>
    manifestQuery.error.value instanceof Error ? manifestQuery.error.value.message : null,
  )

  const slotOverrides = ref<Map<string, LeagueSlot['league']>>(new Map())
  const failedIds = ref<string[]>([])
  const loadingIds = ref<string[]>([])
  const isRetrying = ref(false)

  const slots = computed<LeagueSlot[]>(() =>
    configs.value.map((config) => {
      const base = toSlot(config)
      const league = slotOverrides.value.get(config.id)
      return league ? { ...base, league } : base
    }),
  )

  const initialBatchSize = INITIAL_BATCH_SIZE
  const isLoadingMore = computed(() => loadingIds.value.length > 0)
  const failedCount = computed(() => failedIds.value.length)

  async function loadLeague(config: LeagueManifest) {
    const teams = await fetchLeagueCardTeams(queryClient, config)
    slotOverrides.value = new Map(slotOverrides.value).set(
      config.id,
      toLeagueCard(config, teams),
    )
  }

  async function loadLeagues(configBatch: LeagueManifest[]) {
    const pending = configBatch.filter(
      (config) =>
        !slotOverrides.value.has(config.id) &&
        !loadingIds.value.includes(config.id) &&
        !failedIds.value.includes(config.id),
    )

    if (pending.length === 0) {
      return
    }

    loadingIds.value = [...loadingIds.value, ...pending.map((config) => config.id)]

    for (const config of pending) {
      try {
        await loadLeague(config)
      } catch {
        failedIds.value = [...failedIds.value.filter((id) => id !== config.id), config.id]
      } finally {
        loadingIds.value = loadingIds.value.filter((loadingId) => loadingId !== config.id)
      }
    }
  }

  async function loadNextBatch(ids: string[]) {
    if (loadError.value || ids.length === 0) {
      return
    }

    const configBatch = ids
      .map((id) => configs.value.find((config) => config.id === id))
      .filter((config): config is LeagueManifest => Boolean(config))

    await loadLeagues(configBatch)
  }

  async function retryFailed() {
    if (isRetrying.value || failedIds.value.length === 0) {
      return
    }

    isRetrying.value = true
    const toRetry = failedIds.value
      .map((id) => configs.value.find((config) => config.id === id))
      .filter((config): config is LeagueManifest => Boolean(config))

    failedIds.value = []

    try {
      await loadLeagues(toRetry)
    } finally {
      isRetrying.value = false
    }
  }

  return {
    slots,
    isManifestLoading,
    loadError,
    initialBatchSize,
    isLoadingMore,
    failedCount,
    isRetrying,
    loadNextBatch,
    retryFailed,
  }
}
