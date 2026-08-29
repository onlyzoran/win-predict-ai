import { describe, expect, it, vi } from 'vitest'
import { resolveFootballFactsGlossary, isFootballSport } from './factsGlossary'

vi.mock('@onlyzoran/win-predict-ai-ui', () => ({
  FOOTBALL_STANDINGS_GLOSSARY: [
    { abbr: 'GP', label: 'Games played' },
    { abbr: 'GF', label: 'Goals for' },
    { abbr: 'Pts', label: 'Points' },
  ],
}))

describe('factsGlossary', () => {
  const t = (key: string) => {
    const labels: Record<string, string> = {
      'facts.glossary.GP': 'Games played',
      'facts.glossary.GF': 'Goals for',
      'facts.glossary.Pts': 'Points',
    }
    return labels[key] ?? key
  }

  it('maps football glossary abbreviations through i18n', () => {
    expect(resolveFootballFactsGlossary(t)).toEqual([
      { abbr: 'GP', label: 'Games played' },
      { abbr: 'GF', label: 'Goals for' },
      { abbr: 'Pts', label: 'Points' },
    ])
  })

  it('detects football sport slug', () => {
    expect(isFootballSport('football')).toBe(true)
    expect(isFootballSport('baseball')).toBe(false)
    expect(isFootballSport(undefined)).toBe(false)
  })
})
