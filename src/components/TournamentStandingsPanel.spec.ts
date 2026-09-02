import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import TournamentStandingsPanel from './TournamentStandingsPanel.vue'
import en from '@/locales/en.json'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
})

describe('TournamentStandingsPanel', () => {
  it('renders outcome semantics for games played and record', () => {
    const wrapper = mount(TournamentStandingsPanel, {
      props: {
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
      },
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.find('.bg-chart-2\\/20').text()).toBe('111')
    expect(wrapper.find('.bg-chart-1\\/15').text()).toBe('69–42')
  })

  it('renders outcome badges in predictions-only mode when standings exist', () => {
    const wrapper = mount(TournamentStandingsPanel, {
      props: {
        predictionsOnly: true,
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
      },
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.text()).toContain('GP 111')
    expect(wrapper.text()).toContain('69–42')
    expect(wrapper.find('.bg-chart-2\\/20').exists()).toBe(true)
    expect(wrapper.find('.bg-chart-1\\/15').exists()).toBe(true)
  })
})
