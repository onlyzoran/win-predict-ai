import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref, type MaybeRefOrGetter } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { useLeagueHistoryRanks } from './useLeagueHistoryRanks'

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

function mountComposable(id: MaybeRefOrGetter<string | undefined>) {
  let api!: ReturnType<typeof useLeagueHistoryRanks>

  mount(
    defineComponent({
      setup() {
        api = useLeagueHistoryRanks(id)
        return () => h('div')
      },
    }),
  )

  return api
}

describe('useLeagueHistoryRanks', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('leaves series null when days count is 1', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<(input: RequestInfo | URL) => Promise<unknown>>(async (input) => {
        const url = String(input)
        if (url.endsWith('history/epl/days.json')) {
          return jsonResponse({
            leagueId: 'epl',
            count: 1,
            first: '2026-08-01',
            last: '2026-08-01',
            days: ['2026-08-01'],
          })
        }
        return errorResponse()
      }),
    )

    const { series, isLoading, error } = mountComposable('epl')
    await flushPromises()

    expect(isLoading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(series.value).toBeNull()
  })

  it('leaves series null when days.json is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<(input: RequestInfo | URL) => Promise<unknown>>(async () => errorResponse(404)),
    )

    const { series, isLoading } = mountComposable('unknown')
    await flushPromises()

    expect(isLoading.value).toBe(false)
    expect(series.value).toBeNull()
  })

  it('builds series from sampled multi-day history', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<(input: RequestInfo | URL) => Promise<unknown>>(async (input) => {
        const url = String(input)
        if (url.endsWith('history/mlb/days.json')) {
          return jsonResponse({
            leagueId: 'mlb',
            count: 2,
            first: '2026-03-25',
            last: '2026-03-26',
            days: ['2026-03-25', '2026-03-26'],
          })
        }
        if (url.endsWith('history/mlb/2026-03-25.json')) {
          return jsonResponse({
            leagueId: 'mlb',
            date: '2026-03-25',
            metric: 'wins',
            standings: [
              { team: 'Yankees', group: 'AL', rank: 1 },
              { team: 'Dodgers', group: 'NL', rank: 2 },
            ],
          })
        }
        if (url.endsWith('history/mlb/2026-03-26.json')) {
          return jsonResponse({
            leagueId: 'mlb',
            date: '2026-03-26',
            metric: 'wins',
            standings: [
              { team: 'Dodgers', group: 'NL', rank: 1 },
              { team: 'Yankees', group: 'AL', rank: 2 },
            ],
          })
        }
        return errorResponse()
      }),
    )

    const { series, isLoading, error } = mountComposable('mlb')
    await flushPromises()

    expect(isLoading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(series.value?.points).toHaveLength(2)
    expect(series.value?.teams.map((t) => t.name)).toEqual(['Dodgers', 'Yankees'])
  })

  it('skips loading when league id is undefined', async () => {
    const fetchMock = vi.fn<() => Promise<unknown>>()
    vi.stubGlobal('fetch', fetchMock)

    const { series, isLoading } = mountComposable(ref(undefined))
    await flushPromises()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(isLoading.value).toBe(false)
    expect(series.value).toBeNull()
  })
})
