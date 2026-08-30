import { describe, expect, it } from 'vitest'
import { formatFactsCell, resolveFactsColumns, sortFactsRows } from './factsTable'
import type { StandingRow } from '@/types/league'

describe('factsTable', () => {
  const soccerRows: StandingRow[] = [
    {
      team: 'Krasnodar',
      rank: 1,
      played: 3,
      wins: 3,
      draws: 0,
      losses: 0,
      goalsFor: 8,
      goalsAgainst: 3,
      points: 9,
      goalDifference: 5,
      group: '',
    },
    {
      team: 'Zenit St Petersburg',
      rank: 2,
      played: 3,
      wins: 2,
      draws: 1,
      losses: 0,
      goalsFor: 6,
      goalsAgainst: 3,
      points: 7,
      goalDifference: 3,
      group: '',
    },
  ]

  it('builds soccer columns with goals for, goals against, goal difference, and points', () => {
    expect(resolveFactsColumns(soccerRows, 'points').map((column) => column.key)).toEqual([
      'rank',
      'team',
      'played',
      'wins',
      'draws',
      'losses',
      'goalsFor',
      'goalsAgainst',
      'goalDifference',
      'points',
    ])
  })

  it('sorts rows by rank when available', () => {
    expect(sortFactsRows(soccerRows).map((row) => row.team)).toEqual([
      'Krasnodar',
      'Zenit St Petersburg',
    ])
  })

  it('formats goal difference with a plus sign for positive values', () => {
    expect(formatFactsCell(soccerRows[0]!, 'goalDifference')).toBe('+5')
  })

  it('builds baseball columns with win percent instead of points', () => {
    const baseballRows: StandingRow[] = [
      {
        team: 'Yankees',
        rank: 1,
        played: 111,
        wins: 69,
        losses: 42,
        winPercent: 0.6216216,
        group: 'American League',
      },
    ]

    expect(resolveFactsColumns(baseballRows, 'wins').map((column) => column.key)).toEqual([
      'rank',
      'team',
      'group',
      'played',
      'wins',
      'losses',
      'winPercent',
    ])
  })
})
