import { computed, onMounted, ref } from 'vue'
import type {
  League,
  LeagueEntry,
  LeagueManifest,
  LeagueSlot,
} from '@/types/league'
import { sportIcons } from '@/lib/sportIcons'
import { getTournamentProgress } from '@/lib/utils'

const DATA_BASE_URL = (
  import.meta.env.VITE_DATA_BASE_URL ?? `${import.meta.env.BASE_URL}data`
).replace(/\/$/, '')

const LEAGUE_FETCH_ATTEMPTS = 2
const RETRY_DELAY_MS = 400

async function fetchJson<T>(file: string): Promise<T> {
  const res = await fetch(`${DATA_BASE_URL}/${file}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Failed to load ${file}: ${res.status}`)
  }
  return res.json() as Promise<T>
}

async function fetchJsonWithRetry<T>(file: string, attempts = LEAGUE_FETCH_ATTEMPTS): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fetchJson<T>(file)
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt))
      }
    }
  }

  throw lastError
}

function toTeams(entries: LeagueEntry[]) {
  return entries
    .map((entry, index) => ({
      id: String(index + 1),
      name: entry.team,
      winProbability: entry.win_predict,
    }))
    .sort((a, b) => b.winProbability - a.winProbability)
}

function toLeague(config: LeagueManifest, entries: LeagueEntry[]): League {
  return {
    id: config.id,
    title: config.title,
    teams: toTeams(entries),
    sport: config.sport,
    icon: sportIcons[config.sport],
    progress: getTournamentProgress(config.startDate, config.endDate, config.endDateTo),
    startDate: config.startDate,
    endDate: config.endDateTo || config.endDate,
    popularPriority: config.popularPriority,
  }
}

function toSlot(config: LeagueManifest): LeagueSlot {
  return {
    id: config.id,
    sport: config.sport,
    popularPriority: config.popularPriority,
    league: null,
  }
}

export function useLeagues() {
  const slots = ref<LeagueSlot[]>([])
  const isManifestLoading = ref(true)
  const loadError = ref<string | null>(null)
  const failedConfigs = ref<LeagueManifest[]>([])
  const isRetrying = ref(false)

  const failedCount = computed(() => failedConfigs.value.length)

  async function loadLeague(config: LeagueManifest) {
    const entries = await fetchJsonWithRetry<LeagueEntry[]>(config.file)
    slots.value = slots.value.map((slot) =>
      slot.id === config.id ? { ...slot, league: toLeague(config, entries) } : slot,
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
