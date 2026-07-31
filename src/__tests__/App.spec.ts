import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { mount, flushPromises } from '@vue/test-utils'
import App from '../App.vue'
import { i18n } from '@/i18n'

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('mounts and renders the app title', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [i18n],
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Win Predict AI')
  })
})
