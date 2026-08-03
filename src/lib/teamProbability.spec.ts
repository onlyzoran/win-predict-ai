import { describe, expect, it } from 'vitest'
import { aggregateTopTeams, getTeamChartColor, TOP_TEAMS_COUNT } from './teamProbability'

const teams = [
  { id: '1', name: 'Team A', winProbability: 30 },
  { id: '2', name: 'Team B', winProbability: 20 },
  { id: '3', name: 'Team C', winProbability: 15 },
  { id: '4', name: 'Team D', winProbability: 12 },
  { id: '5', name: 'Team E', winProbability: 10 },
  { id: '6', name: 'Team F', winProbability: 8 },
  { id: '7', name: 'Team G', winProbability: 5 },
]

describe('aggregateTopTeams', () => {
  it('keeps top N teams and aggregates the rest as Others', () => {
    const result = aggregateTopTeams(teams, {
      topN: TOP_TEAMS_COUNT,
      othersLabel: 'Others (2)',
    })

    expect(result).toHaveLength(6)
    expect(result.slice(0, 5).map((team) => team.name)).toEqual([
      'Team A',
      'Team B',
      'Team C',
      'Team D',
      'Team E',
    ])
    expect(result[5]).toEqual({
      id: 'rest',
      name: 'Others (2)',
      winProbability: 13,
    })
  })

  it('does not add Others when there are N or fewer teams', () => {
    const result = aggregateTopTeams(teams.slice(0, 5), {
      topN: TOP_TEAMS_COUNT,
      othersLabel: 'Others (0)',
    })

    expect(result).toEqual(teams.slice(0, 5))
  })
})

describe('getTeamChartColor', () => {
  it('returns chart colors for top teams only', () => {
    expect(getTeamChartColor(0)).toBe('var(--chart-1)')
    expect(getTeamChartColor(4)).toBe('var(--chart-5)')
    expect(getTeamChartColor(5)).toBeUndefined()
  })
})
