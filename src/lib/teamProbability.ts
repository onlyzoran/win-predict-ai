import type { TeamProbability } from '@/types/league'

export const TOP_TEAMS_COUNT = 5

// cool violet, aligned with zinc/theme hue ~270
export const CHART_COLORS = [
  'oklch(0.78 0.12 270)',
  'oklch(0.68 0.13 270)',
  'oklch(0.58 0.14 270)',
  'oklch(0.48 0.13 270)',
  'oklch(0.40 0.11 270)',
] as const

export const OTHERS_CHART_COLOR = 'oklch(0.32 0.06 270)'

export function getTeamChartColor(index: number, topN = TOP_TEAMS_COUNT): string | undefined {
  if (index < 0 || index >= topN) {
    return undefined
  }

  return CHART_COLORS[index % CHART_COLORS.length] ?? CHART_COLORS[0]
}

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
