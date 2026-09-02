import { describe, expect, it, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useHomeScreenLayout } from '@/composables/useHomeScreenLayout'

describe('useHomeScreenLayout', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to category-slider layout', () => {
    const { homeScreenLayout } = useHomeScreenLayout()
    expect(homeScreenLayout.value).toBe('category-slider')
  })

  it('persists selected layout', async () => {
    const { homeScreenLayout } = useHomeScreenLayout()

    homeScreenLayout.value = 'grid'
    await nextTick()
    expect(homeScreenLayout.value).toBe('grid')

    homeScreenLayout.value = 'category-slider'
    await nextTick()
    expect(homeScreenLayout.value).toBe('category-slider')
  })
})
