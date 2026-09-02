import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MatchResultCards from './MatchResultCards.vue'
import { DEMO_MATCH_RESULT_CARDS } from '@/dev-fixtures/matchResults'

describe('MatchResultCards', () => {
  it('renders final and intermediate outcome cards with pastel semantics', () => {
    const wrapper = mount(MatchResultCards, {
      props: {
        cards: DEMO_MATCH_RESULT_CARDS,
      },
    })

    expect(wrapper.findAll('[data-slot="card"]')).toHaveLength(4)
    expect(wrapper.findAll('.border-l-chart-1')).toHaveLength(2)
    expect(wrapper.findAll('.border-l-chart-2')).toHaveLength(2)
    expect(wrapper.find('.bg-chart-1\\/15').text()).toContain('Final')
    expect(wrapper.find('.bg-chart-2\\/20').text()).toContain('In progress')
    expect(wrapper.text()).toContain('2 : 1')
    expect(wrapper.text()).toContain('1 : 0')
  })
})
