import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { effectScope, nextTick } from 'vue'
import {
  createInitialConsentState,
  CONSENT_STORAGE_KEY,
  useConsent,
} from '@onlyzoran/win-predict-ai-ui'
import { loadAnalyticsIfConsented, resetAnalyticsLoadGuard } from './loadAnalyticsIfConsented'

describe('loadAnalyticsIfConsented', () => {
  beforeEach(() => {
    localStorage.clear()
    resetAnalyticsLoadGuard()
  })

  afterEach(() => {
    resetAnalyticsLoadGuard()
  })

  it('does not call loader before consent is decided', () => {
    const scope = effectScope()
    let called = false

    scope.run(() => {
      loadAnalyticsIfConsented(() => {
        called = true
      })
    })

    expect(called).toBe(false)
    scope.stop()
  })

  it('does not call loader when analytics is rejected', () => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        ...createInitialConsentState(),
        decided: true,
        categories: { necessary: true, preferences: false, analytics: false },
        updatedAt: new Date().toISOString(),
      }),
    )

    const scope = effectScope()
    let called = false

    scope.run(() => {
      loadAnalyticsIfConsented(() => {
        called = true
      })
    })

    expect(called).toBe(false)
    scope.stop()
  })

  it('calls loader again after resetConsent and re-opt-in', async () => {
    const scope = effectScope()
    let callCount = 0

    await scope.run(async () => {
      loadAnalyticsIfConsented(() => {
        callCount += 1
      })

      const { acceptAll, resetConsent } = useConsent()

      acceptAll()
      await nextTick()
      expect(callCount).toBe(1)

      resetConsent()
      await nextTick()
      acceptAll()
      await nextTick()
      expect(callCount).toBe(2)
    })

    scope.stop()
  })

  it('calls loader once when analytics consent is granted', () => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        ...createInitialConsentState(),
        decided: true,
        categories: { necessary: true, preferences: true, analytics: true },
        updatedAt: new Date().toISOString(),
      }),
    )

    const scope = effectScope()
    let callCount = 0

    scope.run(() => {
      loadAnalyticsIfConsented(() => {
        callCount += 1
      })
      loadAnalyticsIfConsented(() => {
        callCount += 1
      })
    })

    expect(callCount).toBe(1)
    scope.stop()
  })
})
