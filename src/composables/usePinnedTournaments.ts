import { useStorage } from '@vueuse/core'
import { togglePinned } from '@/lib/tournaments'

export function usePinnedTournaments() {
  const pinnedTournaments = useStorage<string[]>('pinnedTournaments', [])

  function handlePin(id: string, pinned: boolean) {
    pinnedTournaments.value = togglePinned(pinnedTournaments.value, id, pinned)
  }

  return { pinnedTournaments, handlePin }
}
