import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n } from '@/i18n'
import TeamProbabilityList from './TeamProbabilityList.vue'

const teams = [
  { id: '1', name: 'Team A', winProbability: 30 },
  { id: '2', name: 'Team B', winProbability: 20 },
  { id: '3', name: 'Team C', winProbability: 15 },
  { id: '4', name: 'Team D', winProbability: 12 },
  { id: '5', name: 'Team E', winProbability: 10 },
  { id: '6', name: 'Team F', winProbability: 8 },
  { id: '7', name: 'Team G', winProbability: 5 },
]

function mountList(props: Record<string, unknown> = {}) {
  return mount(TeamProbabilityList, {
    props: {
      id: 'epl',
      title: 'Premier League',
      teams,
      pinned: false,
      ...props,
    },
    global: {
      plugins: [i18n],
    },
  })
}

describe('TeamProbabilityList', () => {
  it('shows top 5 teams and aggregates the rest as Others', () => {
    const wrapper = mountList()

    expect(wrapper.text()).toContain('Team A')
    expect(wrapper.text()).toContain('Team E')
    expect(wrapper.text()).not.toContain('Team F')
    expect(wrapper.text()).toContain('Others (2)')
    expect(wrapper.text()).toContain('13%')
  })

  it('does not show Others when there are 5 or fewer teams', () => {
    const wrapper = mountList({ teams: teams.slice(0, 5) })

    expect(wrapper.text()).not.toContain('Others')
    expect(wrapper.text()).toContain('Team E')
  })

  it('emits pin with id and current pinned state', async () => {
    const wrapper = mountList({ pinned: false })

    await wrapper.get('button[aria-label="Pin tournament"]').trigger('click')

    expect(wrapper.emitted('pin')).toEqual([['epl', false]])
  })

  it('emits details with league payload', async () => {
    const wrapper = mountList({
      fullTitle: 'England Premier League',
      progress: 42,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      pinned: true,
    })

    const detailsButton = wrapper.findAll('button').find((button) => button.text() === 'Details')
    expect(detailsButton).toBeTruthy()
    await detailsButton!.trigger('click')

    expect(wrapper.emitted('details')?.[0]?.[0]).toMatchObject({
      title: 'Premier League',
      fullTitle: 'England Premier League',
      teams,
      progress: 42,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      pinned: true,
    })
  })
})
