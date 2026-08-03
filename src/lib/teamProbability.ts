import type { TeamProbability } from '@/types/league'

export const TOP_TEAMS_COUNT = 5

// Monochrome green ramp, matching shadcn pie (green theme)
export const CHART_COLORS = [
  'oklch(0.82 0.14 160)',
  'oklch(0.72 0.15 160)',
  'oklch(0.62 0.14 160)',
  'oklch(0.52 0.12 160)',
  'oklch(0.42 0.10 160)',
] as const

export const OTHERS_CHART_COLOR = 'oklch(0.34 0.07 160)'

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
