import { describe, expect, it } from 'vitest'
import type { StandingRow, TeamProbability } from '@/types/league'
import {
  abbreviateGroup,
  formatRecord,
  formatWinPercent,
  hasWinsStandings,
  mergeStandings,
} from './standings'

describe('abbreviateGroup', () => {
  it('abbreviates known MLB leagues', () => {
    expect(abbreviateGroup('American League')).toBe('AL')
    expect(abbreviateGroup('National League')).toBe('NL')
  })

  it('returns unknown groups unchanged', () => {
    expect(abbreviateGroup('Pacific Division')).toBe('Pacific Division')
  })
})

describe('formatWinPercent', () => {
  it('formats fractions in MLB style', () => {
    expect(formatWinPercent(0.6216216)).toBe('.622')
    expect(formatWinPercent(0.5)).toBe('.500')
    expect(formatWinPercent(0)).toBe('.000')
    expect(formatWinPercent(1)).toBe('1.000')
  })
})

describe('formatRecord', () => {
  it('joins wins and losses with an en dash', () => {
    expect(formatRecord(69, 42)).toBe('69–42')
  })
})

describe('mergeStandings', () => {
  const teams: TeamProbability[] = [
    { id: '1', name: 'Milwaukee Brewers', winProbability: 18 },
    { id: '2', name: 'Los Angeles Dodgers', winProbability: 15 },
  ]

  const standings: StandingRow[] = [
    {
      team: 'Milwaukee Brewers',
      played: 111,
      wins: 69,
      losses: 42,
      winPercent: 0.6216216,
      playoffSeed: 1,
      group: 'National League',
    },
  ]

  it('attaches matching wins standings by team name', () => {
    const merged = mergeStandings(teams, standings)

    expect(merged[0]?.standings).toEqual({
      group: 'National League',
      playoffSeed: 1,
      played: 111,
      wins: 69,
      losses: 42,
      winPercent: 0.6216216,
    })
    expect(merged[1]?.standings).toBeUndefined()
  })

  it('prefers participantId when present', () => {
    const merged = mergeStandings(
      [{ id: 'milwaukee-brewers', name: 'Brewers Alias', winProbability: 18 }],
      [
        {
          participantId: 'milwaukee-brewers',
          team: 'Milwaukee Brewers',
          played: 111,
          wins: 69,
          losses: 42,
          winPercent: 0.6216216,
          playoffSeed: 1,
          group: 'National League',
        },
      ],
    )

    expect(merged[0]?.standings?.group).toBe('National League')
  })

  it('ignores points-only rows without winPercent', () => {
    const merged = mergeStandings(teams, [
      {
        team: 'Milwaukee Brewers',
        played: 10,
        wins: 5,
        losses: 3,
        draws: 2,
        points: 17,
        group: 'National League',
      },
    ])

    expect(merged[0]?.standings).toBeUndefined()
  })
})

describe('hasWinsStandings', () => {
  it('detects whether any team has wins standings', () => {
    expect(hasWinsStandings([{ id: '1', name: 'A', winProbability: 10 }])).toBe(false)
    expect(
      hasWinsStandings([
        {
          id: '1',
          name: 'A',
          winProbability: 10,
          standings: {
            group: 'NL',
            wins: 1,
            losses: 0,
            winPercent: 1,
          },
        },
      ]),
    ).toBe(true)
  })
})
