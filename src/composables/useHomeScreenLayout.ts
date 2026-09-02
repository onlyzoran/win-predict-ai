import { useStorage } from '@vueuse/core'
import { watch } from 'vue'
import {
  isHomeScreenLayout,
  resolveHomeScreenLayout,
  type HomeScreenLayout,
} from '@/lib/homeScreenLayout'

const STORAGE_KEY = 'homeScreenLayout'

export function useHomeScreenLayout() {
  const homeScreenLayout = useStorage<HomeScreenLayout>(
    STORAGE_KEY,
    resolveHomeScreenLayout(),
  )

  watch(
    homeScreenLayout,
    (value) => {
      if (!isHomeScreenLayout(value)) {
        homeScreenLayout.value = resolveHomeScreenLayout()
      }
    },
    { immediate: true },
  )

  return { homeScreenLayout }
}
