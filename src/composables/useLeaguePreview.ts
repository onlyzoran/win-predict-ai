import { ref, watch } from 'vue'
import type { League, SelectedLeague } from '@/types/league'
import { loadLeagueById } from '@/lib/leagueData'

function toSelectedLeague(league: League): SelectedLeague {
  return {
    id: league.id,
    title: league.title,
    fullTitle: league.fullTitle,
    teams: league.teams,
    progress: league.progress,
    startDate: league.startDate,
    endDate: league.endDate,
    icon: league.icon,
  }
}

export function useLeaguePreview() {
  const isPreviewOpen = ref(false)
  const previewLeague = ref<SelectedLeague | null>(null)
  const isPreviewLoading = ref(false)
  let previewRequestId = 0

  async function openPreview(cardLeague: SelectedLeague) {
    const requestId = ++previewRequestId
    isPreviewOpen.value = true
    isPreviewLoading.value = true
    previewLeague.value = cardLeague

    try {
      const full = await loadLeagueById(cardLeague.id)
      if (requestId !== previewRequestId) {
        return
      }
      if (full) {
        previewLeague.value = toSelectedLeague(full)
      }
    } catch {
      if (requestId !== previewRequestId) {
        return
      }
    } finally {
      if (requestId === previewRequestId) {
        isPreviewLoading.value = false
      }
    }
  }

  watch(isPreviewOpen, (open) => {
    if (!open) {
      previewRequestId += 1
      previewLeague.value = null
      isPreviewLoading.value = false
    }
  })

  return {
    isPreviewOpen,
    previewLeague,
    isPreviewLoading,
    openPreview,
  }
}
