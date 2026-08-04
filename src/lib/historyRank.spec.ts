import { describe, expect, it } from 'vitest'
import type { LeagueHistorySnapshot } from '@/types/league'
import {
  MAX_HISTORY_POINTS,
  buildRankSeries,
  sampleHistoryDates,
  teamRankColor,
} from './historyRank'

describe('sampleHistoryDates', () => {
  it('returns all dates when under the limit', () => {
    const days = ['2026-03-25', '2026-03-26', '2026-03-27']
    expect(sampleHistoryDates(days, 40)).toEqual(days)
  })

  it('keeps first and last when sampling', () => {
    const labels = Array.from({ length: 100 }, (_, i) => `day-${String(i).padStart(3, '0')}`)
    const sampled = sampleHistoryDates(labels, 10)

    expect(sampled).toHaveLength(10)
    expect(sampled[0]).toBe('day-000')
    expect(sampled[sampled.length - 1]).toBe('day-099')
    expect(new Set(sampled).size).toBe(10)
  })

  it('caps at maxPoints', () => {
    const days = Array.from({ length: 133 }, (_, i) => `2026-01-${String(i + 1).padStart(3, '0')}`)
    const sampled = sampleHistoryDates(days)
    expect(sampled.length).toBeLessThanOrEqual(MAX_HISTORY_POINTS)
    expect(sampled[0]).toBe(days[0])
    expect(sampled[sampled.length - 1]).toBe(days[days.length - 1])
  })

  it('returns empty array for empty input', () => {
    expect(sampleHistoryDates([])).toEqual([])
  })
})

describe('buildRankSeries', () => {
  const snapshots: LeagueHistorySnapshot[] = [
    {
      leagueId: 'mlb',
      date: '2026-03-26',
      metric: 'wins',
      standings: [
        { team: 'Yankees', group: 'AL', rank: 2 },
        { team: 'Dodgers', group: 'NL', rank: 1 },
      ],
    },
    {
      leagueId: 'mlb',
      date: '2026-03-25',
      metric: 'wins',
      standings: [
        { team: 'Yankees', group: 'AL', rank: 1 },
        { team: 'Dodgers', group: 'NL', rank: 2 },
      ],
    },
  ]

  it('orders points by date and teams by latest rank', () => {
    const series = buildRankSeries(snapshots)

    expect(series.points.map((p) => p.date)).toEqual(['2026-03-25', '2026-03-26'])
    expect(series.teams.map((t) => t.name)).toEqual(['Dodgers', 'Yankees'])
    expect(series.points[0]?.ranks.Yankees).toBe(1)
    expect(series.points[1]?.ranks.Dodgers).toBe(1)
    expect(series.teams[0]?.color).toBe(teamRankColor(0, 2))
  })

  it('returns empty series for empty snapshots', () => {
    expect(buildRankSeries([])).toEqual({ teams: [], points: [] })
  })
})
