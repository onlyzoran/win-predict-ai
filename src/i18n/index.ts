import { createI18n } from 'vue-i18n'
import { useStorage } from '@vueuse/core'
import de from '@/locales/de.json'
import en from '@/locales/en.json'
import es from '@/locales/es.json'
import fr from '@/locales/fr.json'
import it from '@/locales/it.json'
import ru from '@/locales/ru.json'

export const locales = ['en', 'de', 'fr', 'es', 'it', 'ru'] as const

export type Locale = (typeof locales)[number]

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  ru: 'Русский',
}

function detectLocale(): Locale {
  const language = navigator.language.toLowerCase()
  const match = locales.find((code) => language === code || language.startsWith(`${code}-`))
  return match ?? 'en'
}

function applyDocumentLang(value: Locale) {
  document.documentElement.lang = value
}

export const locale = useStorage<Locale>('locale', detectLocale())

if (!locales.includes(locale.value)) {
  locale.value = detectLocale()
}

applyDocumentLang(locale.value)

export const i18n = createI18n({
  legacy: false,
  locale: locale.value,
  fallbackLocale: 'en',
  messages: { en, de, fr, es, it, ru },
})

export function setLocale(next: Locale) {
  locale.value = next
  i18n.global.locale.value = next
  applyDocumentLang(next)
}
