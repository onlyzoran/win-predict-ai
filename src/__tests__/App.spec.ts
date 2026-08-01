import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../App.vue'
import { i18n } from '@/i18n'

const manifest = [
  {
    id: 'epl',
    title: 'Premier League',
    sport: 'football',
    file: 'epl.json',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    popularPriority: 1,
  },
  {
    id: 'nba',
    title: 'NBA',
    sport: 'basketball',
    file: 'nba.json',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    popularPriority: 2,
  },
]

const eplTeams = [
  { team: 'Arsenal', win_predict: 40 },
  { team: 'Chelsea', win_predict: 30 },
]

const nbaTeams = [
  { team: 'Lakers', win_predict: 55 },
  { team: 'Celtics', win_predict: 45 },
]

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

function mockFetchByFile(handlers: Record<string, () => unknown>) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    for (const [file, handler] of Object.entries(handlers)) {
      if (url.endsWith(file)) {
        return handler()
      }
    }
    return errorResponse(404)
  })
}

function mountApp() {
  return mount(App, {
    global: {
      plugins: [i18n],
    },
  })
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('mounts and renders the app title', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])))

    const wrapper = mountApp()
    await flushPromises()

    expect(wrapper.text()).toContain('Win Predict AI')
  })

  it('loads leagues and renders tournament cards', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByFile({
        'leagues.json': () => jsonResponse(manifest),
        'epl.json': () => jsonResponse(eplTeams),
        'nba.json': () => jsonResponse(nbaTeams),
      }),
    )

    const wrapper = mountApp()
    await flushPromises()

    expect(wrapper.text()).toContain('Premier League')
    expect(wrapper.text()).toContain('NBA')
    expect(wrapper.text()).toContain('Arsenal')
    expect(wrapper.text()).toContain('Lakers')
  })

  it('shows an error when the manifest fails to load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errorResponse(503)))

    const wrapper = mountApp()
    await flushPromises()

    expect(wrapper.text()).toContain('Could not load data')
  })

  it('shows a partial error when a league fails to load and keeps the rest', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      mockFetchByFile({
        'leagues.json': () => jsonResponse(manifest),
        'epl.json': () => jsonResponse(eplTeams),
        'nba.json': () => errorResponse(404),
      }),
    )

    try {
      const wrapper = mountApp()
      await flushPromises()
      await vi.runAllTimersAsync()
      await flushPromises()

      expect(wrapper.text()).toContain('Premier League')
      expect(wrapper.text()).not.toContain('NBA')
      expect(wrapper.text()).toContain('1 tournaments failed to load')
      expect(wrapper.text()).toContain('Retry')
    } finally {
      vi.useRealTimers()
    }
  })

  it('retries failed leagues when Retry is clicked', async () => {
    vi.useFakeTimers()
    let nbaAttempts = 0
    vi.stubGlobal(
      'fetch',
      mockFetchByFile({
        'leagues.json': () => jsonResponse(manifest),
        'epl.json': () => jsonResponse(eplTeams),
        'nba.json': () => {
          nbaAttempts += 1
          return nbaAttempts <= 2 ? errorResponse(404) : jsonResponse(nbaTeams)
        },
      }),
    )

    try {
      const wrapper = mountApp()
      await flushPromises()
      await vi.runAllTimersAsync()
      await flushPromises()

      expect(wrapper.text()).toContain('1 tournaments failed to load')

      const retryButton = wrapper.findAll('button').find((button) => button.text() === 'Retry')
      expect(retryButton).toBeTruthy()
      await retryButton!.trigger('click')
      await flushPromises()
      await vi.runAllTimersAsync()
      await flushPromises()

      expect(wrapper.text()).toContain('NBA')
      expect(wrapper.text()).toContain('Lakers')
      expect(wrapper.text()).not.toContain('tournaments failed to load')
    } finally {
      vi.useRealTimers()
    }
  })
})