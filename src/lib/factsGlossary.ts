import {
  FOOTBALL_STANDINGS_GLOSSARY,
  type StandingsGlossaryEntry,
} from '@onlyzoran/win-predict-ai-ui'

type Translate = (key: string) => string

export function resolveFootballFactsGlossary(t: Translate): StandingsGlossaryEntry[] {
  return FOOTBALL_STANDINGS_GLOSSARY.map((entry) => ({
    abbr: entry.abbr,
    label: t(`facts.glossary.${entry.abbr}`),
  }))
}

export function isFootballSport(sport: string | undefined): boolean {
  return sport === 'football'
}
