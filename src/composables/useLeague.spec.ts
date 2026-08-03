import { describe, expect, it, vi, afterEach } from 'vitest'
import { defineComponent, h, type MaybeRefOrGetter } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { useLeague } from './useLeague'

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

  mount(
    defineComponent({
      setup() {
        api = useLeague(id)
        return () => h('div')
      },
    }),
  )

  return api
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

    const { league, isLoading, notFound, loadError } = mountUseLeague('epl')
    await flushPromises()

    expect(isLoading.value).toBe(false)
    expect(notFound.value).toBe(false)
    expect(loadError.value).toBeNull()
    expect(league.value?.title).toBe('Premier League')
    expect(league.value?.teams[0]?.name).toBe('Arsenal')
    expect(league.value?.teams[0]?.standings).toBeUndefined()
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

    const { league, isLoading, loadError } = mountUseLeague('mlb-world-series-26')
    await flushPromises()

    expect(isLoading.value).toBe(false)
    expect(loadError.value).toBeNull()
    expect(league.value?.teams[0]?.standings).toEqual({
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

    const { league, notFound, isLoading } = mountUseLeague('missing')
    await flushPromises()

    expect(isLoading.value).toBe(false)
    expect(notFound.value).toBe(true)
    expect(league.value).toBeNull()
  })
})
