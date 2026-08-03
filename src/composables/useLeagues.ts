import { computed, onMounted, ref } from 'vue'
import type { LeagueEntry, LeagueManifest, LeagueSlot } from '@/types/league'
import {
  fetchJson,
  fetchJsonWithRetry,
  fetchStandingsOptional,
  toLeague,
  toSlot,
} from '@/lib/leagueData'

export function useLeagues() {
  const slots = ref<LeagueSlot[]>([])
  const isManifestLoading = ref(true)
  const loadError = ref<string | null>(null)
  const failedConfigs = ref<LeagueManifest[]>([])
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

  async function loadLeagues(configs: LeagueManifest[]) {
    for (const config of configs) {
      try {
        await loadLeague(config)
      } catch {
        slots.value = slots.value.filter((slot) => slot.id !== config.id)
        failedConfigs.value = [...failedConfigs.value, config]
      }
    }
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
      const configs = await fetchJson<LeagueManifest[]>('leagues.json')
      slots.value = configs.map(toSlot)
      isManifestLoading.value = false
      await loadLeagues(configs)
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'Failed to load data'
      isManifestLoading.value = false
    }
  })

  return {
    slots,
    isManifestLoading,
    loadError,
    failedCount,
    isRetrying,
    retryFailed,
  }
}
