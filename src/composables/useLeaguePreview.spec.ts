import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { IconBallFootball } from '@onlyzoran/win-predict-ai-icons'
import type { SelectedLeague } from '@/types/league'
import { useLeaguePreview } from './useLeaguePreview'

vi.mock('@/lib/leagueData', () => ({
  loadLeagueById: vi.fn(),
}))

import { loadLeagueById } from '@/lib/leagueData'

const cardLeague: SelectedLeague = {
  id: 'mlb-world-series-26',
  title: 'MLB WS',
  teams: [
    { id: '1', name: 'Team A', winProbability: 0.2 },
    { id: 'others', name: 'Others (25)', winProbability: 0.1, othersCount: 25 },
  ],
  progress: 50,
  startDate: '2026-03-01',
  endDate: '2026-10-31',
  icon: IconBallFootball,
}

describe('useLeaguePreview', () => {
  it('loads full league teams for preview instead of card snapshot', async () => {
    vi.mocked(loadLeagueById).mockResolvedValue({
      id: 'mlb-world-series-26',
      title: 'MLB WS',
      teams: Array.from({ length: 30 }, (_, index) => ({
        id: String(index + 1),
        name: `Team ${index + 1}`,
        winProbability: 0.03,
      })),
      sport: 'baseball',
      icon: IconBallFootball,
      progress: 50,
      startDate: '2026-03-01',
      endDate: '2026-10-31',
      popularPriority: 1,
      layout: 'contests',
      contestPath: 'contests/mlb-world-series-26',
    })

    const { isPreviewOpen, previewLeague, isPreviewLoading, openPreview } = useLeaguePreview()

    await openPreview(cardLeague)
    await nextTick()

    expect(isPreviewOpen.value).toBe(true)
    expect(isPreviewLoading.value).toBe(false)
    expect(loadLeagueById).toHaveBeenCalledWith('mlb-world-series-26')
    expect(previewLeague.value?.teams).toHaveLength(30)
    expect(previewLeague.value?.teams.some((team) => team.id === 'others')).toBe(false)
  })

  it('keeps card teams when full load fails', async () => {
    vi.mocked(loadLeagueById).mockRejectedValue(new Error('network'))

    const { previewLeague, isPreviewLoading, openPreview } = useLeaguePreview()

    await openPreview(cardLeague)

    expect(isPreviewLoading.value).toBe(false)
    expect(previewLeague.value?.teams).toEqual(cardLeague.teams)
  })
})
