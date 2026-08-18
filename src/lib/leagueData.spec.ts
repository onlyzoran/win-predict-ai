import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  loadLeagueCardPayload,
  resolveContestCardPath,
  toLeagueFromCardTeams,
} from './leagueData'
import type { LeagueManifest } from '@/types/league'

function jsonResponse(data: unknown) {
  return {
    ok: true,
    json: async () => data,
  }
}

describe('leagueData card snapshots', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves contest card path from contestPath', () => {
    expect(resolveContestCardPath('contests/mlb-world-series-26')).toBe(
      'contests/mlb-world-series-26/predictions/card.json',
    )
  })

  it('loads contests layout from predictions/card.json only', async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL) => Promise<unknown>>(async (input) => {
      const url = String(input)
      if (url.endsWith('contests/mlb-world-series-26/predictions/card.json')) {
        return jsonResponse({
          kind: 'predictionCard',
          contestId: 'mlb-world-series-26',
          date: '2026-08-18',
          items: [
            {
              participantId: 'los-angeles-dodgers',
              name: 'Los Angeles Dodgers',
              probability: 7.89,
            },
            {
              participantId: 'others',
              name: 'Others',
              probability: 73.6,
              othersCount: 25,
            },
          ],
        })
      }
      throw new Error(`Unexpected fetch: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const config: LeagueManifest = {
      id: 'mlb-world-series-26',
      title: 'MLB World Series',
      sport: 'baseball',
      layout: 'contests',
      contestPath: 'contests/mlb-world-series-26',
      startDate: '2026-03-26',
      endDate: '2026-11-01',
      popularPriority: 130,
    }

    const teams = await loadLeagueCardPayload(config)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('predictions/card.json')
    expect(teams[0]?.name).toBe('Los Angeles Dodgers')
    expect(teams.at(-1)).toMatchObject({
      id: 'others',
      othersCount: 25,
    })
  })

  it('loads legacy layout from the league file without facts or participants', async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL) => Promise<unknown>>(async (input) => {
      const url = String(input)
      if (url.endsWith('epl.json')) {
        return jsonResponse([
          { team: 'Arsenal', win_predict: 40 },
          { team: 'Chelsea', win_predict: 30 },
        ])
      }
      throw new Error(`Unexpected fetch: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const config: LeagueManifest = {
      id: 'epl',
      title: 'Premier League',
      sport: 'football',
      file: 'epl.json',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      popularPriority: 1,
    }

    const teams = await loadLeagueCardPayload(config)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(teams.map((team) => team.name)).toEqual(['Arsenal', 'Chelsea'])
  })

  it('builds a league object from card teams for home cards', () => {
    const config: LeagueManifest = {
      id: 'mlb-world-series-26',
      title: 'MLB World Series',
      sport: 'baseball',
      layout: 'contests',
      contestPath: 'contests/mlb-world-series-26',
      startDate: '2026-03-26',
      endDate: '2026-11-01',
      popularPriority: 130,
    }

    const league = toLeagueFromCardTeams(config, [
      { id: 'los-angeles-dodgers', name: 'Los Angeles Dodgers', winProbability: 7.89 },
      { id: 'others', name: 'Others', winProbability: 73.6, othersCount: 25 },
    ])

    expect(league.layout).toBe('contests')
    expect(league.contestPath).toBe('contests/mlb-world-series-26')
    expect(league.teams.at(-1)?.othersCount).toBe(25)
  })
})
