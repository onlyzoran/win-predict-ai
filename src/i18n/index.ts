import { createI18n } from 'vue-i18n'
import { useStorage } from '@vueuse/core'
import en from '@/locales/en.json'
import ru from '@/locales/ru.json'

export type Locale = 'en' | 'ru'

function detectLocale(): Locale {
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

export const locale = useStorage<Locale>('locale', detectLocale())

export const i18n = createI18n({
  legacy: false,
  locale: locale.value,
  fallbackLocale: 'en',
  messages: { en, ru },
})

export function toggleLocale() {
  const next: Locale = locale.value === 'en' ? 'ru' : 'en'
  locale.value = next
  i18n.global.locale.value = next
}
