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

export async function fetchJson<T>(file: string): Promise<T> {
  const res = await fetch(`${DATA_BASE_URL}/${file}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Failed to load ${file}: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function fetchJsonWithRetry<T>(
  file: string,
  attempts = LEAGUE_FETCH_ATTEMPTS,
): Promise<T> {
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

export function toTeams(entries: LeagueEntry[]) {
  return entries
    .map((entry, index) => ({
      id: String(index + 1),
      name: entry.team,
      winProbability: entry.win_predict,
    }))
    .sort((a, b) => b.winProbability - a.winProbability)
}

export function toLeague(config: LeagueManifest, entries: LeagueEntry[]): League {
  return {
    id: config.id,
    title: config.title,
    fullTitle: config.fullTitle,
    teams: toTeams(entries),
    sport: config.sport,
    icon: sportIcons[config.sport],
    progress: getTournamentProgress(config.startDate, config.endDate, config.endDateTo),
    startDate: config.startDate,
    endDate: config.endDateTo || config.endDate,
    popularPriority: config.popularPriority,
  }
}

export function toSlot(config: LeagueManifest): LeagueSlot {
  return {
    id: config.id,
    sport: config.sport,
    popularPriority: config.popularPriority,
    league: null,
  }
}

export async function loadLeagueById(id: string): Promise<League | null> {
  const configs = await fetchJson<LeagueManifest[]>('leagues.json')
  const config = configs.find((entry) => entry.id === id)
  if (!config) {
    return null
  }
  const entries = await fetchJsonWithRetry<LeagueEntry[]>(config.file)
  return toLeague(config, entries)
}
