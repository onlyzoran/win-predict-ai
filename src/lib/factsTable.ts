import type { StandingRow } from '@/types/league'
import { abbreviateGroup, formatWinPercent } from '@/lib/standings'

export type FactsColumnKey =
  | 'rank'
  | 'team'
  | 'group'
  | 'played'
  | 'wins'
  | 'draws'
  | 'losses'
  | 'goalsFor'
  | 'goalsAgainst'
  | 'goalDifference'
  | 'points'
  | 'winPercent'

export interface FactsTableColumn {
  key: FactsColumnKey
  align: 'left' | 'center'
}

function rowHasValue(rows: StandingRow[], key: keyof StandingRow): boolean {
  return rows.some((row) => row[key] != null)
}

function rowHasNonEmptyGroup(rows: StandingRow[]): boolean {
  return rows.some((row) => Boolean(row.group))
}

export function resolveFactsColumns(rows: StandingRow[], metric: string): FactsTableColumn[] {
  if (rows.length === 0) {
    return [{ key: 'team', align: 'left' }]
  }

  const columns: FactsTableColumn[] = []

  if (rowHasValue(rows, 'rank')) {
    columns.push({ key: 'rank', align: 'center' })
  }

  columns.push({ key: 'team', align: 'left' })

  if (rowHasNonEmptyGroup(rows)) {
    columns.push({ key: 'group', align: 'center' })
  }

  if (rowHasValue(rows, 'played')) {
    columns.push({ key: 'played', align: 'center' })
  }

  if (rowHasValue(rows, 'wins')) {
    columns.push({ key: 'wins', align: 'center' })
  }

  if (rowHasValue(rows, 'draws')) {
    columns.push({ key: 'draws', align: 'center' })
  }

  if (rowHasValue(rows, 'losses')) {
    columns.push({ key: 'losses', align: 'center' })
  }

  if (rowHasValue(rows, 'goalsFor')) {
    columns.push({ key: 'goalsFor', align: 'center' })
  }

  if (rowHasValue(rows, 'goalsAgainst')) {
    columns.push({ key: 'goalsAgainst', align: 'center' })
  }

  if (rowHasValue(rows, 'goalDifference')) {
    columns.push({ key: 'goalDifference', align: 'center' })
  }

  const showPoints = metric === 'points' || rowHasValue(rows, 'points')
  const showWinPercent = !showPoints && (metric === 'wins' || rowHasValue(rows, 'winPercent'))

  if (showPoints) {
    columns.push({ key: 'points', align: 'center' })
  } else if (showWinPercent) {
    columns.push({ key: 'winPercent', align: 'center' })
  }

  return columns
}

export function sortFactsRows(rows: StandingRow[]): StandingRow[] {
  return [...rows].sort((left, right) => {
    const leftRank = left.rank ?? left.playoffSeed
    const rightRank = right.rank ?? right.playoffSeed

    if (leftRank != null && rightRank != null && leftRank !== rightRank) {
      return leftRank - rightRank
    }

    if (leftRank != null && rightRank == null) {
      return -1
    }

    if (leftRank == null && rightRank != null) {
      return 1
    }

    if (left.points != null && right.points != null && left.points !== right.points) {
      return right.points - left.points
    }

    if (left.winPercent != null && right.winPercent != null && left.winPercent !== right.winPercent) {
      return right.winPercent - left.winPercent
    }

    return left.team.localeCompare(right.team)
  })
}

export function formatGoalDifference(value: number): string {
  if (value > 0) {
    return `+${value}`
  }

  return String(value)
}

export function formatFactsCell(row: StandingRow, key: FactsColumnKey): string {
  switch (key) {
    case 'rank':
      return row.rank != null ? String(row.rank) : row.playoffSeed != null ? String(row.playoffSeed) : '—'
    case 'team':
      return row.team
    case 'group':
      return row.group ? abbreviateGroup(row.group) : '—'
    case 'played':
      return row.played != null ? String(row.played) : '—'
    case 'wins':
      return row.wins != null ? String(row.wins) : '—'
    case 'draws':
      return row.draws != null ? String(row.draws) : '—'
    case 'losses':
      return row.losses != null ? String(row.losses) : '—'
    case 'goalsFor':
      return row.goalsFor != null ? String(row.goalsFor) : '—'
    case 'goalsAgainst':
      return row.goalsAgainst != null ? String(row.goalsAgainst) : '—'
    case 'goalDifference':
      return row.goalDifference != null ? formatGoalDifference(row.goalDifference) : '—'
    case 'points':
      return row.points != null ? String(row.points) : '—'
    case 'winPercent':
      return row.winPercent != null ? formatWinPercent(row.winPercent) : '—'
    default:
      return '—'
  }
}
