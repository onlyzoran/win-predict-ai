import { afterEach, describe, expect, it, vi } from 'vitest'

describe('i18n', () => {
  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('setLocale updates the i18n locale and document lang', async () => {
    const { setLocale, i18n, locale } = await import('./index')

    setLocale('de')

    expect(locale.value).toBe('de')
    expect(i18n.global.locale.value).toBe('de')
    expect(document.documentElement.lang).toBe('de')

    setLocale('en')
  })

  it('falls back when storage contains an invalid locale', async () => {
    localStorage.setItem('locale', JSON.stringify('nope'))
    vi.stubGlobal('navigator', { language: 'en-US' })

    const { locale } = await import('./index')

    expect(locale.value).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })

  it('detects locale from navigator.language on first load', async () => {
    vi.stubGlobal('navigator', { language: 'fr-FR' })

    const { locale } = await import('./index')

    expect(locale.value).toBe('fr')
  })
})
