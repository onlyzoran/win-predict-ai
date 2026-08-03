import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
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
      },
    },
  })
}

describe('TournamentDetails', () => {
  it('does not render pie chart by default', () => {
    const wrapper = mountDetails()

    expect(wrapper.find('[data-testid="win-probability-pie"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Team F')
  })

  it('renders pie chart when showChart is true', () => {
    const wrapper = mountDetails({ showChart: true })

    expect(wrapper.find('[data-testid="win-probability-pie"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Team F')
  })
})
