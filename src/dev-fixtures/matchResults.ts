export type ResultStatus = 'final' | 'intermediate'

export interface MatchResultCard {
  id: string
  league: string
  match: string
  status: ResultStatus
  statusLabel: string
  score: string
  detail: string
}

/** Demo cards for dev/preview — sage (final) vs butter (intermediate). */
export const DEMO_MATCH_RESULT_CARDS: MatchResultCard[] = [
  {
    id: 'epl-final',
    league: 'Premier League',
    match: 'Arsenal — Chelsea',
    status: 'final',
    statusLabel: 'Final',
    score: '2 : 1',
    detail: 'Standings confirmed · champion spot secured',
  },
  {
    id: 'laliga-final',
    league: 'La Liga',
    match: 'Real Madrid — Barcelona',
    status: 'final',
    statusLabel: 'Final',
    score: '1 : 1',
    detail: 'Full time · points locked',
  },
  {
    id: 'bundesliga-live',
    league: 'Bundesliga',
    match: 'Bayern — Dortmund',
    status: 'intermediate',
    statusLabel: 'In progress',
    score: '1 : 0',
    detail: 'Matchday 34 · 67\'',
  },
  {
    id: 'seriea-live',
    league: 'Serie A',
    match: 'Inter — Milan',
    status: 'intermediate',
    statusLabel: 'In progress',
    score: '0 : 0',
    detail: 'Season ongoing · 2 games left',
  },
]
