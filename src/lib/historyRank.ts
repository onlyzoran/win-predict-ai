import type { LeagueHistorySnapshot } from '@/types/league'

export const MAX_HISTORY_POINTS = 40

export interface RankSeriesTeam {
  name: string
  color: string
}

export interface RankSeriesPoint {
  date: string
  x: number
  ranks: Record<string, number>
}

export interface RankSeries {
  teams: RankSeriesTeam[]
  points: RankSeriesPoint[]
}

/** Evenly sample dates, always keeping first and last. */
export function sampleHistoryDates(days: string[], maxPoints = MAX_HISTORY_POINTS): string[] {
  if (days.length === 0) {
    return []
  }

  if (days.length <= maxPoints) {
    return [...days]
  }

  if (maxPoints === 1) {
    return [days[days.length - 1]!]
  }

  const sampled: string[] = []
  const lastIndex = days.length - 1

  for (let i = 0; i < maxPoints; i++) {
    const index = Math.round((i * lastIndex) / (maxPoints - 1))
    const day = days[index]!
    if (sampled[sampled.length - 1] !== day) {
      sampled.push(day)
    }
  }

  return sampled
}

export function teamRankColor(index: number, total: number): string {
  const count = Math.max(total, 1)
  const hue = ((index * 360) / count) % 360
  return `oklch(0.55 0.14 ${hue})`
}

function toTimestamp(date: string): number {
  return Date.parse(`${date}T00:00:00Z`)
}

/** Build chart series from daily snapshots. Teams ordered by latest rank. */
export function buildRankSeries(snapshots: LeagueHistorySnapshot[]): RankSeries {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length === 0) {
    return { teams: [], points: [] }
  }

  const latest = sorted[sorted.length - 1]!
  const teamNames = latest.standings
    .filter((row) => row.rank != null)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((row) => row.team)

  const teams: RankSeriesTeam[] = teamNames.map((name, index) => ({
    name,
    color: teamRankColor(index, teamNames.length),
  }))

  const points: RankSeriesPoint[] = sorted.map((snapshot) => {
    const ranks: Record<string, number> = {}
    for (const row of snapshot.standings) {
      if (row.rank != null) {
        ranks[row.team] = row.rank
      }
    }
    return {
      date: snapshot.date,
      x: toTimestamp(snapshot.date),
      ranks,
    }
  })

  return { teams, points }
}
