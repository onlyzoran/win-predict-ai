import { watch } from 'vue'
import { useConsent } from '@onlyzoran/win-predict-ai-ui'

let analyticsLoaded = false

/**
 * Gate for third-party analytics scripts. Safe no-op until a vendor is chosen.
 * Call once at app startup; re-runs when consent changes after the user decides.
 *
 * Functional localStorage (locale, theme, pins) is unaffected — only the Analytics
 * category triggers the callback.
 *
 * @example
 * // Future GA4 integration (add only after orchestrator Goal picks a vendor):
 * loadAnalyticsIfConsented(() => {
 *   const script = document.createElement('script')
 *   script.async = true
 *   script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX'
 *   document.head.appendChild(script)
 * })
 */
export function loadAnalyticsIfConsented(onConsented?: () => void): void {
  const { consent, hasConsent } = useConsent()

  function maybeLoad() {
    if (!consent.value.decided || !hasConsent('analytics')) {
      analyticsLoaded = false
      return
    }
    if (analyticsLoaded) return
    analyticsLoaded = true
    onConsented?.()
  }

  maybeLoad()
  watch(
    () =>
      [
        consent.value.decided,
        consent.value.categories.analytics,
        consent.value.updatedAt,
      ] as const,
    maybeLoad,
  )
}

/** Test helper — resets module-level load guard. */
export function resetAnalyticsLoadGuard(): void {
  analyticsLoaded = false
}
