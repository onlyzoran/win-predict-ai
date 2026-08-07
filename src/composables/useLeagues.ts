import { computed, onMounted, ref } from 'vue'
import type { LeagueEntry, LeagueManifest, LeagueSlot } from '@/types/league'
import {
  fetchLeaguesManifest,
  fetchJsonWithRetry,
  fetchStandingsOptional,
  toLeague,
  toSlot,
} from '@/lib/leagueData'

const INITIAL_BATCH_SIZE = 12

export function useLeagues() {
  const slots = ref<LeagueSlot[]>([])
  const configs = ref<LeagueManifest[]>([])
  const isManifestLoading = ref(true)
  const loadError = ref<string | null>(null)
  const failedConfigs = ref<LeagueManifest[]>([])
  const loadingIds = ref<string[]>([])
  const initialBatchSize = INITIAL_BATCH_SIZE
  const isLoadingMore = computed(() => loadingIds.value.length > 0)
  const isRetrying = ref(false)

  const failedCount = computed(() => failedConfigs.value.length)

  async function loadLeague(config: LeagueManifest) {
    const [entries, standings] = await Promise.all([
      fetchJsonWithRetry<LeagueEntry[]>(config.file),
      fetchStandingsOptional(config.id),
    ])
    slots.value = slots.value.map((slot) =>
      slot.id === config.id ? { ...slot, league: toLeague(config, entries, standings) } : slot,
    )
  }

  async function loadLeagues(configBatch: LeagueManifest[]) {
    const pending = configBatch.filter(
      (config) =>
        !slots.value.some((slot) => slot.id === config.id && slot.league) &&
        !loadingIds.value.includes(config.id),
    )

    if (pending.length === 0) {
      return
    }

    loadingIds.value = [...loadingIds.value, ...pending.map((config) => config.id)]

    for (const config of pending) {
      try {
        await loadLeague(config)
      } catch {
        slots.value = slots.value.filter((slot) => slot.id !== config.id)
        if (!failedConfigs.value.some((failedConfig) => failedConfig.id === config.id)) {
          failedConfigs.value = [...failedConfigs.value, config]
        }
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
    if (isRetrying.value || failedConfigs.value.length === 0) {
      return
    }

    isRetrying.value = true
    const toRetry = failedConfigs.value
    failedConfigs.value = []
    slots.value = [...slots.value, ...toRetry.map(toSlot)]

    try {
      await loadLeagues(toRetry)
    } finally {
      isRetrying.value = false
    }
  }

  onMounted(async () => {
    try {
      configs.value = await fetchLeaguesManifest<LeagueManifest[]>()
      slots.value = configs.value.map(toSlot)
      isManifestLoading.value = false
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'Failed to load data'
      isManifestLoading.value = false
    }
  })

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
