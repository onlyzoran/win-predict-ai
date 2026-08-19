import { onMounted, ref } from 'vue'
import {
  fetchSportsCatalog,
  getFallbackSportsCatalog,
  resolveSportsCatalog,
} from '@/lib/sportsData'
import type { SportCatalogItem } from '@/types/sport'

export function useSports() {
  const sports = ref<SportCatalogItem[]>(getFallbackSportsCatalog())
  const isLoading = ref(true)
  const loadError = ref<string | null>(null)

  onMounted(async () => {
    try {
      sports.value = resolveSportsCatalog(await fetchSportsCatalog())
      loadError.value = null
    } catch (error) {
      sports.value = getFallbackSportsCatalog()
      loadError.value = error instanceof Error ? error.message : 'Failed to load sports'
    } finally {
      isLoading.value = false
    }
  })

  return {
    sports,
    isLoading,
    loadError,
  }
}
