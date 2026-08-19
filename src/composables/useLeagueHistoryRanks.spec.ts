import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref, type MaybeRefOrGetter } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { VueQueryPlugin } from '@tanstack/vue-query'
import {
  useLeagueHistoryRanks,
  type LeagueHistorySource,
} from './useLeagueHistoryRanks'
import { createTestQueryClient } from '@/test/query'

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

function mountComposable(source: MaybeRefOrGetter<LeagueHistorySource | undefined>) {
  let api!: ReturnType<typeof useLeagueHistoryRanks>
  const queryClient = createTestQueryClient()

  mount(
    defineComponent({
      setup() {
        api = useLeagueHistoryRanks(source)
        return () => h('div')
      },
    }),
    {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
      },
    },
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

    const { series, isLoading, error } = mountComposable({ id: 'epl' })
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

    const { series, isLoading } = mountComposable({ id: 'unknown' })
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

    const { series, isLoading, error } = mountComposable({ id: 'mlb' })
    await flushPromises()

    expect(isLoading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(series.value?.points).toHaveLength(2)
    expect(series.value?.teams.map((t) => t.name)).toEqual(['Dodgers', 'Yankees'])
  })

  it('loads contests facts index and matchday standings paths', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<(input: RequestInfo | URL) => Promise<unknown>>(async (input) => {
        const url = String(input)
        if (url.endsWith('contests/rpl-26-27/facts/index.json')) {
          return jsonResponse({
            contestId: 'rpl-26-27',
            kind: 'facts',
            factKind: 'standings',
            grain: 'matchday',
            count: 2,
            first: '2026-08-09',
            last: '2026-08-11',
            days: ['2026-08-09', '2026-08-11'],
            tours: [
              {
                tour: 3,
                status: 'final',
                slices: ['2026-08-09', '2026-08-11'],
                latestDate: '2026-08-11',
                latestFile: 'standings/tour-03/latest.json',
              },
            ],
          })
        }
        if (url.endsWith('contests/rpl-26-27/participants.json')) {
          return jsonResponse({
            contestId: 'rpl-26-27',
            participants: [{ id: 'zenit-st-petersburg', name: 'Zenit St Petersburg' }],
          })
        }
        if (url.endsWith('contests/rpl-26-27/facts/standings/tour-03/2026-08-09.json')) {
          return jsonResponse({
            kind: 'standings',
            contestId: 'rpl-26-27',
            date: '2026-08-09',
            metric: 'points',
            rows: [{ participantId: 'zenit-st-petersburg', rank: 2 }],
          })
        }
        if (url.endsWith('contests/rpl-26-27/facts/standings/tour-03/2026-08-11.json')) {
          return jsonResponse({
            kind: 'standings',
            contestId: 'rpl-26-27',
            date: '2026-08-11',
            metric: 'points',
            rows: [{ participantId: 'zenit-st-petersburg', rank: 1 }],
          })
        }
        return errorResponse()
      }),
    )

    const { series, isLoading, error } = mountComposable({
      id: 'rpl-26-27',
      layout: 'contests',
      contestPath: 'contests/rpl-26-27',
    })
    await flushPromises()

    expect(isLoading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(series.value?.points).toHaveLength(2)
    expect(series.value?.teams.map((t) => t.name)).toEqual(['Zenit St Petersburg'])
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
