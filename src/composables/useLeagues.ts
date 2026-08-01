import { onMounted, ref } from 'vue'
import type { Component } from 'vue'
import {
  IconBallAmericanFootball,
  IconBallBaseball,
  IconBallBasketball,
  IconBallFootball,
  IconFlag,
  IconGolf,
} from '@tabler/icons-vue'
import IconHockey from '@/components/icons/IconHockey.vue'
import type {
  League,
  LeagueEntry,
  LeagueManifest,
  LeagueSlot,
} from '@/types/league'
import type { Sport } from '@/types/sport'
import { getTournamentProgress } from '@/lib/utils'

const DATA_BASE_URL = (
  import.meta.env.VITE_DATA_BASE_URL ?? `${import.meta.env.BASE_URL}data`
).replace(/\/$/, '')

const sportIcons: Record<Sport, Component> = {
  football: IconBallFootball,
  basketball: IconBallBasketball,
  americanFootball: IconBallAmericanFootball,
  hockey: IconHockey,
  baseball: IconBallBaseball,
  golf: IconGolf,
  politics: IconFlag,
}

async function fetchJson<T>(file: string): Promise<T> {
  const res = await fetch(`${DATA_BASE_URL}/${file}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Failed to load ${file}: ${res.status}`)
  }
  return res.json() as Promise<T>
}

function toTeams(entries: LeagueEntry[]) {
  return entries.map((entry, index) => ({
    id: String(index + 1),
    name: entry.team,
    winProbability: entry.win_predict,
  }))
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

export function useLeagues() {
  const slots = ref<LeagueSlot[]>([])
  const isManifestLoading = ref(true)
  const loadError = ref<string | null>(null)

  onMounted(async () => {
    try {
      const configs = await fetchJson<LeagueManifest[]>('leagues.json')
      slots.value = configs.map((config) => ({
        id: config.id,
        sport: config.sport,
        popularPriority: config.popularPriority,
        league: null,
      }))
      isManifestLoading.value = false

      for (const config of configs) {
        try {
          const entries = await fetchJson<LeagueEntry[]>(config.file)
          slots.value = slots.value.map((slot) =>
            slot.id === config.id ? { ...slot, league: toLeague(config, entries) } : slot,
          )
        } catch {
          slots.value = slots.value.filter((slot) => slot.id !== config.id)
        }
      }
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'Failed to load data'
      isManifestLoading.value = false
    }
  })

  return { slots, isManifestLoading, loadError }
}
