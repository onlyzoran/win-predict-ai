import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from '../App.vue'
import HomeView from '@/views/HomeView.vue'
import TournamentView from '@/views/TournamentView.vue'
import { i18n } from '@/i18n'
import { createTestQueryClient } from '@/test/query'

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
  return vi.fn<(input: RequestInfo | URL) => Promise<unknown>>(async (input) => {
    const url = String(input)
    for (const [file, handler] of Object.entries(handlers)) {
      if (url.endsWith(file)) {
        return handler()
      }
    }
    return errorResponse(404)
  })
}

async function mountApp(initialPath = '/') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: HomeView },
      { path: '/tournament/:id', name: 'tournament', component: TournamentView },
    ],
  })
  await router.push(initialPath)
  await router.isReady()

  const queryClient = createTestQueryClient()

  return mount(App, {
    global: {
      plugins: [i18n, router, [VueQueryPlugin, { queryClient }]],
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
    vi.stubGlobal('fetch', vi.fn<() => Promise<unknown>>().mockResolvedValue(jsonResponse([])))

    const wrapper = await mountApp()
    await flushPromises()

    expect(wrapper.text()).toMatch(/Win Predict\sAI/)
    expect(wrapper.text()).toMatch(/v\d+\.\d+\.\d+/)
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

    const wrapper = await mountApp()
    await flushPromises()

    expect(wrapper.text()).toContain('Premier League')
    expect(wrapper.text()).toContain('NBA')
    expect(wrapper.text()).toContain('Arsenal')
    expect(wrapper.text()).toContain('Lakers')
  })

  it('renders category-slider layout without sport filters', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByFile({
        'leagues.json': () => jsonResponse(manifest),
        'epl.json': () => jsonResponse(eplTeams),
        'nba.json': () => jsonResponse(nbaTeams),
      }),
    )

    const wrapper = await mountApp()
    await flushPromises()

    expect(wrapper.find('[role="group"][aria-label="Home screen layout"]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="Search…"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Football')
    expect(wrapper.text()).toContain('Basketball')
    expect(wrapper.text()).toContain('Premier League')
    expect(wrapper.text()).toContain('Lakers')
  })

  it('switches between grid and category-slider layouts', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByFile({
        'leagues.json': () => jsonResponse(manifest),
        'epl.json': () => jsonResponse(eplTeams),
        'nba.json': () => jsonResponse(nbaTeams),
      }),
    )

    const wrapper = await mountApp()
    await flushPromises()

    const layoutButtons = wrapper.find('[role="group"][aria-label="Home screen layout"]').findAll('button')
    expect(layoutButtons).toHaveLength(2)
    expect(layoutButtons[1]?.attributes('aria-pressed')).toBe('true')

    await layoutButtons[0]?.trigger('click')
    await flushPromises()

    expect(wrapper.find('input[placeholder="Search…"]').exists()).toBe(true)
    expect(localStorage.getItem('homeScreenLayout')).toBe('grid')

    await layoutButtons[1]?.trigger('click')
    await flushPromises()

    expect(wrapper.find('input[placeholder="Search…"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Football')
    expect(localStorage.getItem('homeScreenLayout')).toBe('category-slider')
  })

  it('shows an error when the manifest fails to load', async () => {
    vi.stubGlobal('fetch', vi.fn<() => Promise<unknown>>().mockResolvedValue(errorResponse(503)))

    const wrapper = await mountApp()
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
      const wrapper = await mountApp()
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
      const wrapper = await mountApp()
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

  it('opens the tournament page for a league id', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByFile({
        'leagues.json': () => jsonResponse(manifest),
        'epl.json': () => jsonResponse(eplTeams),
      }),
    )

    const wrapper = await mountApp('/tournament/epl')
    await flushPromises()

    expect(wrapper.text()).toContain('Premier League')
    expect(wrapper.text()).toContain('Arsenal')
    expect(wrapper.text()).toContain('Chelsea')
    expect(wrapper.text()).toContain('Back')
  })

  it('shows not found when the tournament id is unknown', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchByFile({
        'leagues.json': () => jsonResponse(manifest),
      }),
    )

    const wrapper = await mountApp('/tournament/missing')
    await flushPromises()

    expect(wrapper.text()).toContain('Tournament not found')
  })
})
