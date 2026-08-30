import type { QueryClient } from '@tanstack/vue-query'
import type { League, LeagueManifest, TeamProbability } from '@/types/league'
import {
  fetchLeaguesManifest,
  loadLeagueCardPayload,
  loadLeaguePayload,
  toLeague,
  toLeagueFromCardTeams,
} from '@/lib/leagueData'
import { STALE_TIME } from '@/lib/queryClient'
import { queryKeys } from '@/lib/queryKeys'

export async function fetchManifest(queryClient: QueryClient) {
  return queryClient.fetchQuery({
    queryKey: queryKeys.manifest,
    queryFn: () => fetchLeaguesManifest<LeagueManifest[]>(),
    staleTime: STALE_TIME.manifest,
  })
}

export async function fetchLeagueCardTeams(
  queryClient: QueryClient,
  config: LeagueManifest,
): Promise<TeamProbability[]> {
  return queryClient.fetchQuery({
    queryKey: queryKeys.leagueCard(config.id),
    queryFn: () => loadLeagueCardPayload(config),
    staleTime: STALE_TIME.leaguePayload,
  })
}

export async function fetchLeague(queryClient: QueryClient, id: string): Promise<League | null> {
  const configs = await fetchManifest(queryClient)
  const config = configs.find((entry) => entry.id === id)
  if (!config) {
    return null
  }

  const payload = await queryClient.fetchQuery({
    queryKey: ['league-payload', id] as const,
    queryFn: () => loadLeaguePayload(config),
    staleTime: STALE_TIME.leaguePayload,
  })

  return toLeague(config, payload.entries, payload.standings)
}

export function toLeagueCard(config: LeagueManifest, teams: TeamProbability[]): League {
  return toLeagueFromCardTeams(config, teams)
}
