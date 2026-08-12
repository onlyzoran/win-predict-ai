import type {
  ContestFactsFile,
  ContestFactsIndex,
  ContestParticipantsFile,
  ContestPredictionFile,
  League,
  LeagueEntry,
  LeagueHistoryDays,
  LeagueHistorySnapshot,
  LeagueManifest,
  LeagueSlot,
  StandingRow,
  TournamentLayout,
} from '@/types/league'
import { getSportIcon, sportIcons } from '@/lib/sportIcons'
import {
  factsIndexToHistoryDays,
  factsToHistorySnapshot,
  factsToStandingRows,
  predictionToEntries,
  resolveContestStandingsRelativePath,
} from '@/lib/contestData'
import { mergeStandings } from '@/lib/standings'
import { getTournamentProgress } from '@/lib/utils'

const DATA_BASE_URL = (
  import.meta.env.VITE_DATA_BASE_URL ?? `${import.meta.env.BASE_URL}data`
).replace(/\/$/, '')

const LEAGUES_URL = (
  import.meta.env.VITE_LEAGUES_URL ?? `${DATA_BASE_URL}/leagues.json`
).replace(/\/$/, '')

const LEAGUE_FETCH_ATTEMPTS = 2
const RETRY_DELAY_MS = 400

const contestFactsIndexCache = new Map<string, ContestFactsIndex>()
const contestParticipantsCache = new Map<string, ContestParticipantsFile>()

export function isContestsLayout(config: Pick<LeagueManifest, 'layout' | 'contestPath'>): boolean {
  return config.layout === 'contests' && Boolean(config.contestPath)
}

export function resolveLayout(config: Pick<LeagueManifest, 'layout' | 'contestPath'>): TournamentLayout {
  return isContestsLayout(config) ? 'contests' : 'legacy'
}

function normalizeContestPath(contestPath: string): string {
  return contestPath.replace(/\/$/, '')
}

export async function fetchJson<T>(file: string): Promise<T> {
  const res = await fetch(`${DATA_BASE_URL}/${file}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Failed to load ${file}: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function fetchJsonOptional<T>(file: string): Promise<T | null> {
  try {
    return await fetchJson<T>(file)
  } catch {
    return null
  }
}

export async function fetchLeaguesManifest<T = LeagueManifest[]>(): Promise<T> {
  const res = await fetch(LEAGUES_URL, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Failed to load leagues manifest: ${res.status}`)
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

async function fetchContestParticipants(contestPath: string): Promise<ContestParticipantsFile> {
  const base = normalizeContestPath(contestPath)
  const cached = contestParticipantsCache.get(base)
  if (cached) {
    return cached
  }
  const participants = await fetchJsonWithRetry<ContestParticipantsFile>(`${base}/participants.json`)
  contestParticipantsCache.set(base, participants)
  return participants
}

async function fetchContestFactsIndex(contestPath: string): Promise<ContestFactsIndex> {
  const base = normalizeContestPath(contestPath)
  const cached = contestFactsIndexCache.get(base)
  if (cached) {
    return cached
  }
  const index = await fetchJsonWithRetry<ContestFactsIndex>(`${base}/facts/index.json`)
  contestFactsIndexCache.set(base, index)
  return index
}

export async function loadContestLeaguePayload(contestPath: string): Promise<{
  entries: LeagueEntry[]
  standings: StandingRow[] | null
}> {
  const base = normalizeContestPath(contestPath)
  const [prediction, facts, participants] = await Promise.all([
    fetchJsonWithRetry<ContestPredictionFile>(`${base}/predictions/latest.json`),
    fetchJsonOptional<ContestFactsFile>(`${base}/facts/latest.json`),
    fetchContestParticipants(base),
  ])

  return {
    entries: predictionToEntries(prediction, participants),
    standings: facts ? factsToStandingRows(facts, participants) : null,
  }
}

export async function loadLegacyLeaguePayload(config: LeagueManifest): Promise<{
  entries: LeagueEntry[]
  standings: StandingRow[] | null
}> {
  if (!config.file) {
    throw new Error(`Legacy league "${config.id}" is missing file`)
  }

  const [entries, standings] = await Promise.all([
    fetchJsonWithRetry<LeagueEntry[]>(config.file),
    fetchStandingsOptional(config.id),
  ])

  return { entries, standings }
}

export async function loadLeaguePayload(config: LeagueManifest): Promise<{
  entries: LeagueEntry[]
  standings: StandingRow[] | null
}> {
  if (isContestsLayout(config)) {
    return loadContestLeaguePayload(config.contestPath!)
  }
  return loadLegacyLeaguePayload(config)
}

export async function fetchStandingsOptional(leagueId: string): Promise<StandingRow[] | null> {
  try {
    const snapshot = await fetchJson<LeagueHistorySnapshot>(`history/${leagueId}/latest.json`)
    return snapshot.standings
  } catch {
    return null
  }
}

export async function fetchHistoryDaysOptional(
  source: Pick<LeagueManifest, 'id' | 'layout' | 'contestPath'>,
): Promise<LeagueHistoryDays | null> {
  try {
    if (isContestsLayout(source)) {
      const index = await fetchContestFactsIndex(source.contestPath!)
      return factsIndexToHistoryDays(index)
    }
    return await fetchJson<LeagueHistoryDays>(`history/${source.id}/days.json`)
  } catch {
    return null
  }
}

export async function fetchHistorySnapshot(
  source: Pick<LeagueManifest, 'id' | 'layout' | 'contestPath'>,
  date: string,
): Promise<LeagueHistorySnapshot> {
  if (isContestsLayout(source)) {
    const base = normalizeContestPath(source.contestPath!)
    const [index, participants] = await Promise.all([
      fetchContestFactsIndex(base),
      fetchContestParticipants(base),
    ])
    const relative = resolveContestStandingsRelativePath(index, date)
    const facts = await fetchJson<ContestFactsFile>(`${base}/facts/${relative}`)
    return factsToHistorySnapshot(facts, participants)
  }

  return fetchJson<LeagueHistorySnapshot>(`history/${source.id}/${date}.json`)
}

export function toTeams(entries: LeagueEntry[]) {
  return entries
    .map((entry, index) => ({
      id: entry.participantId ?? String(index + 1),
      name: entry.team,
      winProbability: entry.win_predict,
    }))
    .sort((a, b) => b.winProbability - a.winProbability)
}

export function toLeague(
  config: LeagueManifest,
  entries: LeagueEntry[],
  standings?: StandingRow[] | null,
): League {
  const teams = standings ? mergeStandings(toTeams(entries), standings) : toTeams(entries)
  const layout = resolveLayout(config)

  return {
    id: config.id,
    title: config.title,
    fullTitle: config.fullTitle,
    teams,
    sport: config.sport,
    icon: getSportIcon(config.sport) ?? sportIcons.football,
    progress: getTournamentProgress(config.startDate, config.endDate, config.endDateTo),
    startDate: config.startDate,
    endDate: config.endDateTo || config.endDate,
    popularPriority: config.popularPriority,
    layout,
    contestPath: layout === 'contests' ? config.contestPath : undefined,
  }
}

export function toSlot(config: LeagueManifest): LeagueSlot {
  return {
    id: config.id,
    sport: config.sport,
    popularPriority: config.popularPriority,
    sortTitle: config.title,
    sortEndDate: config.endDateTo || config.endDate,
    league: null,
  }
}

export async function loadLeagueById(id: string): Promise<League | null> {
  const configs = await fetchLeaguesManifest<LeagueManifest[]>()
  const config = configs.find((entry) => entry.id === id)
  if (!config) {
    return null
  }
  const { entries, standings } = await loadLeaguePayload(config)
  return toLeague(config, entries, standings)
}
