import type { TeamProbability } from '@/types/league'

export const AMERICAN_LEAGUE = 'American League'
export const NATIONAL_LEAGUE = 'National League'

export interface BracketTeam {
  id: string
  name: string
  seed: number
  winProbability: number
}

export interface BracketMatchup {
  id: string
  higher: BracketTeam | null
  lower: BracketTeam | null
  winner: BracketTeam | null
}

export interface LeagueBracket {
  league: 'al' | 'nl'
  group: string
  seeds: (BracketTeam | null)[]
  wildCard: [BracketMatchup, BracketMatchup]
  divisionSeries: [BracketMatchup, BracketMatchup]
  championshipSeries: BracketMatchup
  champion: BracketTeam | null
}

export interface MlbPlayoffBracket {
  al: LeagueBracket
  nl: LeagueBracket
  worldSeries: BracketMatchup
  winner: BracketTeam | null
}

const MULTI_WORD_NICKNAMES = ['Red Sox', 'White Sox', 'Blue Jays'] as const

/** "New York Yankees" → "Yankees", "Boston Red Sox" → "Red Sox" */
export function shortTeamName(name: string): string {
  const trimmed = name.trim()
  for (const nick of MULTI_WORD_NICKNAMES) {
    if (trimmed.endsWith(nick)) {
      return nick
    }
  }

  const parts = trimmed.split(/\s+/)
  return parts[parts.length - 1] ?? trimmed
}

function toBracketTeam(team: TeamProbability, seed: number): BracketTeam {
  return {
    id: team.id,
    name: team.name,
    seed,
    winProbability: team.winProbability,
  }
}

function compareTeams(a: BracketTeam, b: BracketTeam): number {
  if (b.winProbability !== a.winProbability) {
    return b.winProbability - a.winProbability
  }

  return a.name.localeCompare(b.name)
}

export function pickWinner(
  a: BracketTeam | null,
  b: BracketTeam | null,
): BracketTeam | null {
  if (!a) {
    return b
  }

  if (!b) {
    return a
  }

  return compareTeams(a, b) <= 0 ? a : b
}

function seedAt(seeds: (BracketTeam | null)[], seed: number): BracketTeam | null {
  return seeds[seed - 1] ?? null
}

function buildMatchup(
  id: string,
  higher: BracketTeam | null,
  lower: BracketTeam | null,
): BracketMatchup {
  return {
    id,
    higher,
    lower,
    winner: pickWinner(higher, lower),
  }
}

function topSeedsForGroup(teams: TeamProbability[], group: string): (BracketTeam | null)[] {
  const ranked = teams
    .filter((team) => team.standings?.group === group)
    .sort((a, b) => {
      if (b.winProbability !== a.winProbability) {
        return b.winProbability - a.winProbability
      }

      return a.name.localeCompare(b.name)
    })
    .slice(0, 6)

  const seeds: (BracketTeam | null)[] = Array.from({ length: 6 }, () => null)

  ranked.forEach((team, index) => {
    seeds[index] = toBracketTeam(team, index + 1)
  })

  return seeds
}

function buildLeagueBracket(
  league: 'al' | 'nl',
  group: string,
  seeds: (BracketTeam | null)[],
): LeagueBracket {
  const seed1 = seedAt(seeds, 1)
  const seed2 = seedAt(seeds, 2)
  const seed3 = seedAt(seeds, 3)
  const seed4 = seedAt(seeds, 4)
  const seed5 = seedAt(seeds, 5)
  const seed6 = seedAt(seeds, 6)

  // Wild Card: (3) vs (6), (4) vs (5)
  const wc36 = buildMatchup(`${league}-wc-3-6`, seed3, seed6)
  const wc45 = buildMatchup(`${league}-wc-4-5`, seed4, seed5)

  // Division Series: (1) vs winner(4/5), (2) vs winner(3/6)
  const ds1 = buildMatchup(`${league}-ds-1`, seed1, wc45.winner)
  const ds2 = buildMatchup(`${league}-ds-2`, seed2, wc36.winner)

  const championshipSeries = buildMatchup(`${league}-cs`, ds1.winner, ds2.winner)

  return {
    league,
    group,
    seeds,
    wildCard: [wc36, wc45],
    divisionSeries: [ds1, ds2],
    championshipSeries,
    champion: championshipSeries.winner,
  }
}

export function canBuildMlbBracket(teams: TeamProbability[]): boolean {
  let hasAl = false
  let hasNl = false

  for (const team of teams) {
    const group = team.standings?.group
    if (group === AMERICAN_LEAGUE) {
      hasAl = true
    }
    if (group === NATIONAL_LEAGUE) {
      hasNl = true
    }
    if (hasAl && hasNl) {
      return true
    }
  }

  return false
}

export function buildMlbPlayoffBracket(teams: TeamProbability[]): MlbPlayoffBracket | null {
  if (!canBuildMlbBracket(teams)) {
    return null
  }

  const al = buildLeagueBracket('al', AMERICAN_LEAGUE, topSeedsForGroup(teams, AMERICAN_LEAGUE))
  const nl = buildLeagueBracket('nl', NATIONAL_LEAGUE, topSeedsForGroup(teams, NATIONAL_LEAGUE))
  const worldSeries = buildMatchup('world-series', al.champion, nl.champion)

  return {
    al,
    nl,
    worldSeries,
    winner: worldSeries.winner,
  }
}
