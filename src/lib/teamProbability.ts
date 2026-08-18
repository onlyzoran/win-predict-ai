import type { TeamProbability } from '@/types/league'

export const TOP_TEAMS_COUNT = 5

export function aggregateTopTeams(
  teams: TeamProbability[],
  options: { topN?: number; othersLabel: string },
): TeamProbability[] {
  const topN = options.topN ?? TOP_TEAMS_COUNT
  const topTeams = teams.slice(0, topN)
  const restTeams = teams.slice(topN)

  if (restTeams.length === 0) {
    return topTeams
  }

  const restProbability = restTeams.reduce((sum, restTeam) => sum + restTeam.winProbability, 0)

  return [
    ...topTeams,
    {
      id: 'rest',
      name: options.othersLabel,
      winProbability: restProbability,
    },
  ]
}
