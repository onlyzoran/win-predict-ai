import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConsent, type ConsentLocale } from '@onlyzoran/win-predict-ai-ui'

function toConsentLocale(locale: string): ConsentLocale {
  return locale === 'ru' ? 'ru' : 'en'
}

/** App-level consent state; shares `cookie-consent-preferences` with CookieConsentBanner. */
export function useAppConsent() {
  const { locale } = useI18n()
  const consentLocale = computed(() => toConsentLocale(locale.value))

  return {
    consentLocale,
    ...useConsent(),
  }
}
