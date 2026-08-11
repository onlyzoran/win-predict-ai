import type { StandingRow, TeamProbability, TeamStandings } from '@/types/league'

const GROUP_ABBREVIATIONS: Record<string, string> = {
  'American League': 'AL',
  'National League': 'NL',
  'Eastern Conference': 'East',
  'Western Conference': 'West',
  'American Football Conference': 'AFC',
  'National Football Conference': 'NFC',
}

export function abbreviateGroup(group: string): string {
  return GROUP_ABBREVIATIONS[group] ?? group
}

export function formatWinPercent(value: number): string {
  if (value <= 0) {
    return '.000'
  }

  if (value >= 1) {
    return '1.000'
  }

  return value.toFixed(3).replace(/^0/, '')
}

export function formatRecord(wins: number, losses: number): string {
  return `${wins}–${losses}`
}

export function toTeamStandings(row: StandingRow): TeamStandings | undefined {
  if (row.winPercent == null || row.wins == null || row.losses == null) {
    return undefined
  }

  return {
    group: row.group,
    playoffSeed: row.playoffSeed,
    played: row.played,
    wins: row.wins,
    losses: row.losses,
    winPercent: row.winPercent,
  }
}

export function mergeStandings(
  teams: TeamProbability[],
  standings: StandingRow[],
): TeamProbability[] {
  const byName = new Map(standings.map((row) => [row.team, row]))
  const byParticipantId = new Map(
    standings
      .filter((row) => row.participantId)
      .map((row) => [row.participantId!, row]),
  )

  return teams.map((team) => {
    const row = byParticipantId.get(team.id) ?? byName.get(team.name)
    if (!row) {
      return team
    }

    const teamStandings = toTeamStandings(row)
    if (!teamStandings) {
      return team
    }

    return {
      ...team,
      standings: teamStandings,
    }
  })
}

export function hasWinsStandings(teams: TeamProbability[]): boolean {
  return teams.some((team) => team.standings != null)
}
