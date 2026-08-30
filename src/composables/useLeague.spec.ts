import { describe, expect, it, vi, afterEach } from 'vitest'
import { defineComponent, h, type MaybeRefOrGetter } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { useLeague } from './useLeague'
import { createTestQueryClient } from '@/test/query'

function jsonResponse(data: unknown) {
  return {
    ok: true,
    json: async () => data,
  }
}

function errorResponse(status = 500) {
  return {
    ok: false,
    status,
    json: async () => ({}),
  }
}

function mountUseLeague(id: MaybeRefOrGetter<string>) {
  let api!: ReturnType<typeof useLeague>
  const queryClient = createTestQueryClient()

  mount(
    defineComponent({
      setup() {
        api = useLeague(id)
        return () => h('div')
      },
    }),
    {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
      },
    },
  )

  return { api, queryClient }
}

describe('useLeague', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads a league by id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<(input: RequestInfo | URL) => Promise<unknown>>(async (input) => {
        const url = String(input)
        if (url.endsWith('leagues.json')) {
          return jsonResponse([
            {
              id: 'epl',
              title: 'Premier League',
              sport: 'football',
              file: 'epl.json',
              startDate: '2026-01-01',
              endDate: '2026-12-31',
              popularPriority: 1,
            },
          ])
        }
        if (url.endsWith('epl.json')) {
          return jsonResponse([{ team: 'Arsenal', win_predict: 40 }])
        }
        return errorResponse(404)
      }),
    )

    const { api } = mountUseLeague('epl')
    await flushPromises()

    expect(api.isLoading.value).toBe(false)
    expect(api.notFound.value).toBe(false)
    expect(api.loadError.value).toBeNull()
    expect(api.league.value?.title).toBe('Premier League')
    expect(api.league.value?.teams[0]?.name).toBe('Arsenal')
    expect(api.league.value?.teams[0]?.standings).toBeUndefined()
  })

  it('merges optional history standings when available', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<(input: RequestInfo | URL) => Promise<unknown>>(async (input) => {
        const url = String(input)
        if (url.endsWith('leagues.json')) {
          return jsonResponse([
            {
              id: 'mlb-world-series-26',
              title: 'MLB World Series',
              sport: 'baseball',
              file: 'mlb-world-series-26.json',
              startDate: '2026-03-26',
              endDate: '2026-11-01',
              popularPriority: 130,
            },
          ])
        }
        if (url.endsWith('mlb-world-series-26.json')) {
          return jsonResponse([{ team: 'Milwaukee Brewers', win_predict: 18 }])
        }
        if (url.endsWith('history/mlb-world-series-26/latest.json')) {
          return jsonResponse({
            leagueId: 'mlb-world-series-26',
            date: '2026-08-03',
            metric: 'wins',
            standings: [
              {
                team: 'Milwaukee Brewers',
                played: 111,
                wins: 69,
                losses: 42,
                winPercent: 0.6216216,
                playoffSeed: 1,
                group: 'National League',
              },
            ],
          })
        }
        return errorResponse(404)
      }),
    )

    const { api } = mountUseLeague('mlb-world-series-26')
    await flushPromises()

    expect(api.isLoading.value).toBe(false)
    expect(api.loadError.value).toBeNull()
    expect(api.league.value?.layout).toBe('legacy')
    expect(api.league.value?.teams[0]?.standings).toEqual({
      group: 'National League',
      playoffSeed: 1,
      played: 111,
      wins: 69,
      losses: 42,
      winPercent: 0.6216216,
    })
  })

  it('loads contests layout via predictions, facts, and participants', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<(input: RequestInfo | URL) => Promise<unknown>>(async (input) => {
        const url = String(input)
        if (url.endsWith('leagues.json')) {
          return jsonResponse([
            {
              id: 'mlb-world-series-26',
              title: 'MLB World Series',
              sport: 'baseball',
              layout: 'contests',
              contestPath: 'contests/mlb-world-series-26',
              startDate: '2026-03-26',
              endDate: '2026-11-01',
              popularPriority: 130,
            },
          ])
        }
        if (url.endsWith('contests/mlb-world-series-26/predictions/latest.json')) {
          return jsonResponse({
            kind: 'prediction',
            contestId: 'mlb-world-series-26',
            date: '2026-08-11',
            items: [{ participantId: 'milwaukee-brewers', probability: 18 }],
          })
        }
        if (url.endsWith('contests/mlb-world-series-26/facts/latest.json')) {
          return jsonResponse({
            kind: 'standings',
            contestId: 'mlb-world-series-26',
            date: '2026-08-11',
            metric: 'wins',
            rows: [
              {
                participantId: 'milwaukee-brewers',
                played: 111,
                wins: 69,
                losses: 42,
                winPercent: 0.6216216,
                playoffSeed: 1,
                group: 'National League',
              },
            ],
          })
        }
        if (url.endsWith('contests/mlb-world-series-26/participants.json')) {
          return jsonResponse({
            contestId: 'mlb-world-series-26',
            participants: [{ id: 'milwaukee-brewers', name: 'Milwaukee Brewers' }],
          })
        }
        return errorResponse(404)
      }),
    )

    const { api } = mountUseLeague('mlb-world-series-26')
    await flushPromises()

    expect(api.isLoading.value).toBe(false)
    expect(api.loadError.value).toBeNull()
    expect(api.league.value?.layout).toBe('contests')
    expect(api.league.value?.contestPath).toBe('contests/mlb-world-series-26')
    expect(api.league.value?.teams[0]?.id).toBe('milwaukee-brewers')
    expect(api.league.value?.teams[0]?.name).toBe('Milwaukee Brewers')
    expect(api.league.value?.teams[0]?.standings).toEqual({
      group: 'National League',
      playoffSeed: 1,
      played: 111,
      wins: 69,
      losses: 42,
      winPercent: 0.6216216,
    })
  })

  it('marks unknown ids as not found', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<(input: RequestInfo | URL) => Promise<unknown>>(async (input) => {
        if (String(input).endsWith('leagues.json')) {
          return jsonResponse([])
        }
        return errorResponse(404)
      }),
    )

    const { api } = mountUseLeague('missing')
    await flushPromises()

    expect(api.isLoading.value).toBe(false)
    expect(api.notFound.value).toBe(true)
    expect(api.league.value).toBeNull()
  })

  it('reuses cached manifest across remounts', async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL) => Promise<unknown>>(async (input) => {
      const url = String(input)
      if (url.endsWith('leagues.json')) {
        return jsonResponse([
          {
            id: 'epl',
            title: 'Premier League',
            sport: 'football',
            file: 'epl.json',
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            popularPriority: 1,
          },
        ])
      }
      if (url.endsWith('epl.json')) {
        return jsonResponse([{ team: 'Arsenal', win_predict: 40 }])
      }
      return errorResponse(404)
    })
    vi.stubGlobal('fetch', fetchMock)

    const queryClient = createTestQueryClient()
    const mountOne = () =>
      mount(
        defineComponent({
          setup() {
            useLeague('epl')
            return () => h('div')
          },
        }),
        { global: { plugins: [[VueQueryPlugin, { queryClient }]] } },
      )

    mountOne()
    await flushPromises()
    const manifestCallsAfterFirst = fetchMock.mock.calls.filter((call) =>
      String(call[0]).endsWith('leagues.json'),
    ).length

    mountOne()
    await flushPromises()
    const manifestCallsAfterSecond = fetchMock.mock.calls.filter((call) =>
      String(call[0]).endsWith('leagues.json'),
    ).length

    expect(manifestCallsAfterFirst).toBe(1)
    expect(manifestCallsAfterSecond).toBe(1)
  })
})
