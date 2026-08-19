import { useStorage } from '@vueuse/core'
import { toggleHidden } from '@/lib/tournaments'

export function useHiddenTournaments() {
  const hiddenTournaments = useStorage<string[]>('hiddenTournaments', [])

  function handleHide(id: string) {
    hiddenTournaments.value = toggleHidden(hiddenTournaments.value, id, false)
  }

  function handleRestore(id: string) {
    hiddenTournaments.value = toggleHidden(hiddenTournaments.value, id, true)
  }

  return { hiddenTournaments, handleHide, handleRestore }
}
