import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
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

async function mountList(props: Record<string, unknown> = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/tournament/:id', name: 'tournament', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()

  return mount(TeamProbabilityList, {
    props: {
      id: 'epl',
      title: 'Premier League',
      teams,
      pinned: false,
      ...props,
    },
    global: {
      plugins: [i18n, router],
    },
  })
}

describe('TeamProbabilityList', () => {
  it('shows top 5 teams and aggregates the rest as Others', async () => {
    const wrapper = await mountList()

    expect(wrapper.text()).toContain('Team A')
    expect(wrapper.text()).toContain('Team E')
    expect(wrapper.text()).not.toContain('Team F')
    expect(wrapper.text()).toContain('Others (2)')
    expect(wrapper.text()).toContain('13%')
  })

  it('shows pre-aggregated card snapshot teams with localized Others count', async () => {
    const cardTeams = [
      { id: '1', name: 'Team A', winProbability: 30 },
      { id: '2', name: 'Team B', winProbability: 20 },
      { id: '3', name: 'Team C', winProbability: 15 },
      { id: '4', name: 'Team D', winProbability: 12 },
      { id: '5', name: 'Team E', winProbability: 10 },
      { id: 'others', name: 'Others', winProbability: 13, othersCount: 2 },
    ]
    const wrapper = await mountList({ teams: cardTeams })

    expect(wrapper.text()).toContain('Team A')
    expect(wrapper.text()).toContain('Team E')
    expect(wrapper.text()).not.toContain('Team F')
    expect(wrapper.text()).toContain('Others (2)')
    expect(wrapper.text()).toContain('13%')
  })

  it('does not show Others when there are 5 or fewer teams', async () => {
    const wrapper = await mountList({ teams: teams.slice(0, 5) })

    expect(wrapper.text()).not.toContain('Others')
    expect(wrapper.text()).toContain('Team E')
  })

  it('does not show pin or hide controls outside edit mode', async () => {
    const wrapper = await mountList({ pinned: false, editMode: false })

    expect(wrapper.find('button[aria-label="Pin tournament"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Hide tournament"]').exists()).toBe(false)
  })

  it('emits pin with id and current pinned state in edit mode', async () => {
    const wrapper = await mountList({ pinned: false, editMode: true })

    await wrapper.get('button[aria-label="Pin tournament"]').trigger('click')

    expect(wrapper.emitted('pin')).toEqual([['epl', false]])
  })

  it('emits hide with id in edit mode', async () => {
    const wrapper = await mountList({ editMode: true })

    await wrapper.get('button[aria-label="Hide tournament"]').trigger('click')

    expect(wrapper.emitted('hide')).toEqual([['epl']])
  })

  it('emits preview with league payload', async () => {
    const wrapper = await mountList({
      fullTitle: 'England Premier League',
      progress: 42,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      pinned: true,
    })

    const previewButton = wrapper.findAll('button').find((button) => button.text() === 'Preview')
    expect(previewButton).toBeTruthy()
    await previewButton!.trigger('click')

    expect(wrapper.emitted('preview')?.[0]?.[0]).toMatchObject({
      id: 'epl',
      title: 'Premier League',
      fullTitle: 'England Premier League',
      teams,
      progress: 42,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      pinned: true,
    })
  })

  it('links Details to the tournament page', async () => {
    const wrapper = await mountList()

    const detailsLink = wrapper.get('a')
    expect(detailsLink.text()).toBe('Details')
    expect(detailsLink.attributes('href')).toBe('/tournament/epl')
  })

  it('shows season years in the title from start and end dates', async () => {
    const wrapper = await mountList({
      title: 'UCL 26/27',
      startDate: '2026-09-15',
      endDate: '2027-05-30',
    })

    expect(wrapper.text()).toContain('UCL 26/27')
    expect(wrapper.text()).not.toContain('Season')
    expect(wrapper.text()).not.toContain('2026')
  })

  it('shows short team nickname on mobile and full name on desktop', async () => {
    const wrapper = await mountList({
      teams: [{ id: 'nyy', name: 'New York Yankees', winProbability: 30 }],
    })

    const nameCell = wrapper.get('span[title="New York Yankees"]')
    expect(nameCell.find('.md\\:hidden').text()).toBe('Yankees')
    expect(nameCell.find('.hidden.md\\:inline').text()).toBe('New York Yankees')
  })
})
