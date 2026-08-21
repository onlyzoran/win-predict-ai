import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { i18n } from '@/i18n'
import TournamentDetails from './TournamentDetails.vue'

const teams = [
  { id: '1', name: 'Team A', winProbability: 40 },
  { id: '2', name: 'Team B', winProbability: 30 },
  { id: '3', name: 'Team C', winProbability: 20 },
  { id: '4', name: 'Team D', winProbability: 5 },
  { id: '5', name: 'Team E', winProbability: 3 },
  { id: '6', name: 'Team F', winProbability: 2 },
]

const PieStub = defineComponent({
  name: 'WinProbabilityPieChart',
  props: {
    teams: {
      type: Array,
      required: true,
    },
  },
  setup() {
    return () => h('div', { 'data-testid': 'win-probability-pie' })
  },
})

const RankChartStub = defineComponent({
  name: 'StandingsRankChart',
  props: {
    series: {
      type: Object,
      required: true,
    },
  },
  setup() {
    return () => h('div', { 'data-testid': 'standings-rank-chart' })
  },
})

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

function mountDetails(props: Record<string, unknown> = {}) {
  return mount(TournamentDetails, {
    props: {
      title: 'EPL',
      fullTitle: 'England Premier League',
      teams,
      progress: 10,
      startDate: '2026-08-21',
      endDate: '2027-05-30',
      ...props,
    },
    global: {
      plugins: [i18n],
      stubs: {
        WinProbabilityPieChart: PieStub,
        StandingsRankChart: RankChartStub,
        Tabs: {
          template: '<div class="tabs-stub"><slot /></div>',
        },
        TabsList: {
          template: '<div data-slot="tabs-list" role="tablist"><slot /></div>',
        },
        TabsTrigger: {
          template: '<button type="button" role="tab"><slot /></button>',
        },
        TabsContent: {
          template: '<div role="tabpanel"><slot /></div>',
        },
      },
    },
  })
}

describe('TournamentDetails', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-01T12:00:00Z'))
    vi.stubGlobal(
      'fetch',
      vi.fn<(input: RequestInfo | URL) => Promise<unknown>>(async () => errorResponse()),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('does not render pie chart by default', async () => {
    const wrapper = mountDetails()
    await flushPromises()

    expect(wrapper.find('[data-testid="win-probability-pie"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Team F')
  })

  it('renders pie chart when showChart is true', async () => {
    const wrapper = mountDetails({ showChart: true })
    await flushPromises()

    expect(wrapper.find('[data-testid="win-probability-pie"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Team F')
  })

  it('renders detail tabs when showChart is true and compact is false', async () => {
    const wrapper = mountDetails({ showChart: true })
    await flushPromises()

    expect(wrapper.text()).toContain('Standings')
    expect(wrapper.find('[data-slot="tabs-list"]').exists()).toBe(true)
  })

  it('does not render detail tabs in compact preview', async () => {
    const wrapper = mountDetails({ compact: true, showChart: true })
    await flushPromises()

    expect(wrapper.find('[data-slot="tabs-list"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Standings movement')
  })

  it('does not render rank chart when history is unavailable', async () => {
    const wrapper = mountDetails({ showChart: true, leagueId: 'mlb' })
    await flushPromises()

    expect(wrapper.find('[data-testid="standings-rank-chart"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Standings movement')
  })

  it('renders rank chart on the movement tab when multi-day history is available', async () => {
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

    const wrapper = mountDetails({ showChart: true, leagueId: 'mlb' })
    await flushPromises()

    expect(wrapper.text()).toContain('Standings movement')
    expect(wrapper.find('[data-testid="standings-rank-chart"]').exists()).toBe(true)
  })

  it('does not load rank history in compact mode', async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL) => Promise<unknown>>(async () =>
      errorResponse(),
    )
    vi.stubGlobal('fetch', fetchMock)

    mountDetails({ compact: true, showChart: true, leagueId: 'mlb' })
    await flushPromises()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('renders days remaining until start and end in parentheses', async () => {
    const wrapper = mountDetails()
    await flushPromises()
    const text = wrapper.text()

    expect(text).toContain('(in 20 days)')
    expect(text).toContain('(302 days left)')
  })

  it('renders how long the tournament has been ongoing when in progress', async () => {
    vi.setSystemTime(new Date('2026-09-10T12:00:00Z'))
    const wrapper = mountDetails()
    await flushPromises()
    const text = wrapper.text()

    expect(text).toContain('(ongoing for 20 days)')
    expect(text).toContain('(262 days left)')
  })

  it('renders started and ended labels when dates have passed', async () => {
    vi.setSystemTime(new Date('2027-06-01T12:00:00Z'))
    const wrapper = mountDetails()
    await flushPromises()
    const text = wrapper.text()

    expect(text).toContain('(Started)')
    expect(text).toContain('(Ended)')
  })

  it('renders standings columns when teams include wins standings', async () => {
    const wrapper = mountDetails({
      title: 'MLB',
      teams: [
        {
          id: '1',
          name: 'Milwaukee Brewers',
          winProbability: 18,
          standings: {
            group: 'National League',
            playoffSeed: 1,
            played: 111,
            wins: 69,
            losses: 42,
            winPercent: 0.6216216,
          },
        },
      ],
    })
    await flushPromises()
    const text = wrapper.text()

    expect(text).toContain('Conf')
    expect(text).toContain('NL')
    expect(text).toContain('111')
    expect(text).toContain('69–42')
    expect(text).toContain('.622')
    expect(text).toContain('18%')
  })

  it('hides date countdown labels and extra standings columns in compact mode', async () => {
    const wrapper = mountDetails({
      compact: true,
      title: 'MLB',
      teams: [
        {
          id: '1',
          name: 'Milwaukee Brewers',
          winProbability: 18,
          standings: {
            group: 'National League',
            playoffSeed: 1,
            played: 111,
            wins: 69,
            losses: 42,
            winPercent: 0.6216216,
          },
        },
      ],
    })
    await flushPromises()
    const text = wrapper.text()

    expect(text).not.toContain('(in 20 days)')
    expect(text).not.toContain('(302 days left)')
    expect(text).toContain('Team')
    expect(text).toContain('W–L')
    expect(text).toContain('Win %')
    expect(text).not.toContain('Conf')
    expect(text).not.toContain('Pos')
    expect(text).not.toContain('GP')
    expect(text).not.toContain('PCT')
    expect(text).toContain('69–42')
    expect(text).toContain('18%')
    expect(text).not.toContain('.622')
  })

  it('renders playoff projection on its tab for MLB detail view with AL and NL teams', async () => {
    const wrapper = mountDetails({
      showChart: true,
      title: 'MLB World Series',
      teams: [
        {
          id: 'nyy',
          name: 'New York Yankees',
          winProbability: 12,
          standings: {
            group: 'American League',
            wins: 64,
            losses: 51,
            winPercent: 0.557,
          },
        },
        {
          id: 'lad',
          name: 'Los Angeles Dodgers',
          winProbability: 31,
          standings: {
            group: 'National League',
            wins: 69,
            losses: 46,
            winPercent: 0.6,
          },
        },
      ],
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Playoff projection')
    expect(wrapper.text()).toContain('World Series')
    expect(wrapper.text()).toContain('Projected champion')
    expect(wrapper.text()).toContain('Los Angeles Dodgers')
  })

  it('does not render playoff projection in compact preview', async () => {
    const wrapper = mountDetails({
      compact: true,
      showChart: true,
      title: 'MLB World Series',
      teams: [
        {
          id: 'nyy',
          name: 'New York Yankees',
          winProbability: 12,
          standings: {
            group: 'American League',
            wins: 64,
            losses: 51,
            winPercent: 0.557,
          },
        },
        {
          id: 'lad',
          name: 'Los Angeles Dodgers',
          winProbability: 31,
          standings: {
            group: 'National League',
            wins: 69,
            losses: 46,
            winPercent: 0.6,
          },
        },
      ],
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('Playoff projection')
  })

  it('does not render actual standings columns on the predictions tab in detail view', async () => {
    const wrapper = mountDetails({
      showChart: true,
      leagueId: 'mlb',
      title: 'MLB',
      teams: [
        {
          id: '1',
          name: 'Milwaukee Brewers',
          winProbability: 18,
          standings: {
            group: 'National League',
            playoffSeed: 1,
            played: 111,
            wins: 69,
            losses: 42,
            winPercent: 0.6216216,
          },
        },
      ],
    })
    await flushPromises()
    const text = wrapper.text()

    expect(text).toContain('Milwaukee Brewers')
    expect(text).toContain('18%')
    expect(text).not.toContain('Conf')
    expect(text).not.toContain('GP')
    expect(text).not.toContain('69–42')
    expect(text).not.toContain('.622')
  })

  it('shows the actual data tab when contest facts are available', async () => {
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
                goalsFor: 8,
                goalsAgainst: 3,
                points: 9,
                rank: 1,
                goalDifference: 5,
              },
              {
                participantId: 'zenit-st-petersburg',
                played: 3,
                wins: 2,
                draws: 1,
                losses: 0,
                goalsFor: 6,
                goalsAgainst: 3,
                points: 7,
                rank: 2,
                goalDifference: 3,
              },
            ],
          })
        }
        if (url.endsWith('contests/rpl-26-27/participants.json')) {
          return jsonResponse({
            contestId: 'rpl-26-27',
            participants: [
              { id: 'krasnodar', name: 'Krasnodar' },
              { id: 'zenit-st-petersburg', name: 'Zenit St Petersburg' },
            ],
          })
        }
        return errorResponse()
      }),
    )

    const wrapper = mountDetails({
      showChart: true,
      leagueId: 'rpl-26-27',
      layout: 'contests',
      contestPath: 'contests/rpl-26-27',
      sport: 'football',
      title: 'RPL',
    })
    await flushPromises()

    const text = wrapper.text()

    expect(text).toContain('Actual data')
    expect(text).toContain('Krasnodar')
    expect(text).toContain('Zenit St Petersburg')
    expect(text).toContain('GF')
    expect(text).toContain('GA')
    expect(text).toContain('Pts')
    expect(text).toContain('GD')
    expect(text).toContain('Goals for')
    expect(text).toContain('Goals against')
    expect(text).toContain('As of')
    expect(wrapper.find('[data-testid="standings-glossary"]').exists()).toBe(true)
  })

  it('renders football GF, GA, GD, Pts and glossary for EPL facts', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<(input: RequestInfo | URL) => Promise<unknown>>(async (input) => {
        const url = String(input)
        if (url.endsWith('contests/epl-26-27/facts/latest.json')) {
          return jsonResponse({
            kind: 'standings',
            contestId: 'epl-26-27',
            date: '2026-08-11',
            metric: 'points',
            rows: [
              {
                participantId: 'arsenal',
                played: 2,
                wins: 2,
                draws: 0,
                losses: 0,
                goalsFor: 5,
                goalsAgainst: 1,
                points: 6,
                rank: 1,
                goalDifference: 4,
              },
              {
                participantId: 'liverpool',
                played: 2,
                wins: 1,
                draws: 1,
                losses: 0,
                goalsFor: 4,
                goalsAgainst: 2,
                points: 4,
                rank: 2,
                goalDifference: 2,
              },
            ],
          })
        }
        if (url.endsWith('contests/epl-26-27/participants.json')) {
          return jsonResponse({
            contestId: 'epl-26-27',
            participants: [
              { id: 'arsenal', name: 'Arsenal' },
              { id: 'liverpool', name: 'Liverpool' },
            ],
          })
        }
        return errorResponse()
      }),
    )

    const wrapper = mountDetails({
      showChart: true,
      leagueId: 'epl-26-27',
      layout: 'contests',
      contestPath: 'contests/epl-26-27',
      sport: 'football',
      title: 'EPL',
    })
    await flushPromises()

    const text = wrapper.text()

    expect(text).toContain('Arsenal')
    expect(text).toContain('Liverpool')
    expect(text).toContain('GF')
    expect(text).toContain('GA')
    expect(text).toContain('GD')
    expect(text).toContain('Pts')
    expect(wrapper.find('[data-testid="standings-glossary"]').exists()).toBe(true)
  })

  it('hides the actual data tab when facts are unavailable', async () => {
    const wrapper = mountDetails({
      showChart: true,
      leagueId: 'epl',
      layout: 'contests',
      contestPath: 'contests/epl-26-27',
      title: 'EPL',
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('Actual data')
  })
})
