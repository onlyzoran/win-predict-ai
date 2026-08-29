import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchJsonOptional, loadTournamentFactsOptional } from './leagueData'

function jsonResponse(data: unknown) {
  return {
    ok: true,
    json: async () => data,
  }
}

function errorResponse(status = 404) {
  return {
    ok: false,
    status,
    json: async () => ({}),
  }
}

describe('loadTournamentFactsOptional', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn<(input: RequestInfo | URL) => Promise<unknown>>(async () => errorResponse()),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads contests facts from latest.json and participants', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<(input: RequestInfo | URL) => Promise<unknown>>(async (input) => {
        const url = String(input)
        if (url.endsWith('contests/rpl-26-27/facts/latest.json')) {
          return jsonResponse({
            kind: 'standings',
            contestId: 'rpl-26-27',
            date: '2026-08-11',
            metric: 'points',
            rows: [
              {
                participantId: 'krasnodar',
                played: 3,
                wins: 3,
                draws: 0,
                losses: 0,
                points: 9,
                rank: 1,
                goalDifference: 5,
              },
            ],
          })
        }
        if (url.endsWith('contests/rpl-26-27/participants.json')) {
          return jsonResponse({
            contestId: 'rpl-26-27',
            participants: [{ id: 'krasnodar', name: 'Krasnodar' }],
          })
        }
        return errorResponse()
      }),
    )

    const snapshot = await loadTournamentFactsOptional({
      id: 'rpl-26-27',
      layout: 'contests',
      contestPath: 'contests/rpl-26-27',
    })

    expect(snapshot).toEqual({
      date: '2026-08-11',
      metric: 'points',
      rows: [
        {
          participantId: 'krasnodar',
          team: 'Krasnodar',
          played: 3,
          wins: 3,
          draws: 0,
          losses: 0,
          points: 9,
          rank: 1,
          goalDifference: 5,
          winPercent: undefined,
          playoffSeed: undefined,
          group: '',
          sourceRank: undefined,
          goalsFor: undefined,
          goalsAgainst: undefined,
        },
      ],
      fetchedAt: undefined,
    })
  })

  it('loads legacy facts from history latest.json', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<(input: RequestInfo | URL) => Promise<unknown>>(async (input) => {
        const url = String(input)
        if (url.endsWith('history/mlb/latest.json')) {
          return jsonResponse({
            leagueId: 'mlb',
            date: '2026-03-26',
            metric: 'wins',
            standings: [{ team: 'Yankees', group: 'AL', rank: 1, wins: 69, losses: 42, winPercent: 0.622 }],
          })
        }
        return errorResponse()
      }),
    )

    const snapshot = await loadTournamentFactsOptional({
      id: 'mlb',
      layout: 'legacy',
    })

    expect(snapshot?.date).toBe('2026-03-26')
    expect(snapshot?.rows[0]?.team).toBe('Yankees')
  })

  it('returns null when facts are unavailable', async () => {
    const snapshot = await loadTournamentFactsOptional({
      id: 'epl',
      layout: 'contests',
      contestPath: 'contests/epl-26-27',
    })

    expect(snapshot).toBeNull()
  })
})

describe('fetchJsonOptional', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null on failed fetch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<(input: RequestInfo | URL) => Promise<unknown>>(async () => errorResponse()),
    )

    await expect(fetchJsonOptional('missing.json')).resolves.toBeNull()
  })
})
