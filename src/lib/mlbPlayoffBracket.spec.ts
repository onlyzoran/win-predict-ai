import { describe, expect, it } from 'vitest'
import type { TeamProbability } from '@/types/league'
import {
  AMERICAN_LEAGUE,
  NATIONAL_LEAGUE,
  buildMlbPlayoffBracket,
  canBuildMlbBracket,
  pickWinner,
} from './mlbPlayoffBracket'

function team(
  name: string,
  winProbability: number,
  group: string,
  id = name,
): TeamProbability {
  return {
    id,
    name,
    winProbability,
    standings: {
      group,
      wins: 50,
      losses: 50,
      winPercent: 0.5,
    },
  }
}

function al(name: string, pct: number) {
  return team(name, pct, AMERICAN_LEAGUE)
}

function nl(name: string, pct: number) {
  return team(name, pct, NATIONAL_LEAGUE)
}

describe('pickWinner', () => {
  it('picks the higher win probability', () => {
    const a = { id: 'a', name: 'A', seed: 1, winProbability: 10 }
    const b = { id: 'b', name: 'B', seed: 2, winProbability: 20 }

    expect(pickWinner(a, b)?.id).toBe('b')
  })

  it('breaks ties by name', () => {
    const a = { id: 'a', name: 'Yankees', seed: 1, winProbability: 10 }
    const b = { id: 'b', name: 'Astros', seed: 2, winProbability: 10 }

    expect(pickWinner(a, b)?.name).toBe('Astros')
  })

  it('returns the non-null side when one is missing', () => {
    const a = { id: 'a', name: 'A', seed: 1, winProbability: 10 }

    expect(pickWinner(a, null)?.id).toBe('a')
    expect(pickWinner(null, a)?.id).toBe('a')
    expect(pickWinner(null, null)).toBeNull()
  })
})

describe('canBuildMlbBracket', () => {
  it('requires both AL and NL standings groups', () => {
    expect(canBuildMlbBracket([al('Yankees', 12)])).toBe(false)
    expect(canBuildMlbBracket([al('Yankees', 12), nl('Dodgers', 30)])).toBe(true)
    expect(canBuildMlbBracket([{ id: '1', name: 'Solo', winProbability: 5 }])).toBe(false)
  })
})

describe('buildMlbPlayoffBracket', () => {
  const teams: TeamProbability[] = [
    al('Yankees', 12),
    al('Rays', 5),
    al('Red Sox', 4),
    al('Mariners', 3.2),
    al('Rangers', 3.1),
    al('Astros', 2.7),
    al('White Sox', 2.6),
    nl('Dodgers', 31),
    nl('Brewers', 9),
    nl('Braves', 7.5),
    nl('Phillies', 4.2),
    nl('Cubs', 3.6),
    nl('Padres', 2),
    nl('Mets', 1),
  ]

  it('returns null without both leagues', () => {
    expect(buildMlbPlayoffBracket([al('Yankees', 12)])).toBeNull()
  })

  it('seeds top 6 by win probability within each league', () => {
    const bracket = buildMlbPlayoffBracket(teams)

    expect(bracket?.al.seeds.map((s) => s?.name)).toEqual([
      'Yankees',
      'Rays',
      'Red Sox',
      'Mariners',
      'Rangers',
      'Astros',
    ])
    expect(bracket?.nl.seeds.map((s) => s?.name)).toEqual([
      'Dodgers',
      'Brewers',
      'Braves',
      'Phillies',
      'Cubs',
      'Padres',
    ])
    expect(bracket?.al.seeds[0]?.seed).toBe(1)
    expect(bracket?.nl.seeds[5]?.seed).toBe(6)
  })

  it('gives seeds 1 and 2 a bye into the division series', () => {
    const bracket = buildMlbPlayoffBracket(teams)!

    expect(bracket.al.divisionSeries[0].higher?.name).toBe('Yankees')
    expect(bracket.al.divisionSeries[1].higher?.name).toBe('Rays')
    expect(bracket.al.wildCard[0].higher?.name).toBe('Red Sox')
    expect(bracket.al.wildCard[0].lower?.name).toBe('Astros')
    expect(bracket.al.wildCard[1].higher?.name).toBe('Mariners')
    expect(bracket.al.wildCard[1].lower?.name).toBe('Rangers')
  })

  it('advances higher win probability through the full bracket', () => {
    const bracket = buildMlbPlayoffBracket(teams)!

    // AL WC: Red Sox 4 > Astros 2.7; Mariners 3.2 > Rangers 3.1
    expect(bracket.al.wildCard[0].winner?.name).toBe('Red Sox')
    expect(bracket.al.wildCard[1].winner?.name).toBe('Mariners')

    // AL DS: Yankees 12 > Mariners; Rays 5 > Red Sox
    expect(bracket.al.divisionSeries[0].winner?.name).toBe('Yankees')
    expect(bracket.al.divisionSeries[1].winner?.name).toBe('Rays')

    // ALCS: Yankees > Rays
    expect(bracket.al.champion?.name).toBe('Yankees')

    // NL path ends with Dodgers
    expect(bracket.nl.champion?.name).toBe('Dodgers')

    // World Series: Dodgers > Yankees
    expect(bracket.worldSeries.higher?.name).toBe('Yankees')
    expect(bracket.worldSeries.lower?.name).toBe('Dodgers')
    expect(bracket.winner?.name).toBe('Dodgers')
  })

  it('leaves empty slots when a league has fewer than 6 teams', () => {
    const bracket = buildMlbPlayoffBracket([
      al('Yankees', 12),
      al('Rays', 5),
      nl('Dodgers', 31),
      nl('Brewers', 9),
    ])!

    expect(bracket.al.seeds.filter(Boolean)).toHaveLength(2)
    expect(bracket.al.seeds[2]).toBeNull()
    expect(bracket.al.seeds[5]).toBeNull()
    expect(bracket.al.wildCard[0].higher).toBeNull()
    expect(bracket.al.wildCard[0].lower).toBeNull()
    expect(bracket.al.wildCard[0].winner).toBeNull()
    // Seeds 1–2 still advance as bye into DS
    expect(bracket.al.divisionSeries[0].winner?.name).toBe('Yankees')
    expect(bracket.al.champion?.name).toBe('Yankees')
  })
})
