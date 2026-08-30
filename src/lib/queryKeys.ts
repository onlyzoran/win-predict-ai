import type { TournamentLayout } from '@/types/league'

export const queryKeys = {
  manifest: ['manifest'] as const,
  sports: ['sports'] as const,
  league: (id: string) => ['league', id] as const,
  leagueCard: (id: string) => ['league-card', id] as const,
  historyDays: (source: {
    id: string
    layout?: TournamentLayout
    contestPath?: string
  }) => ['history-days', source.id, source.layout ?? 'legacy', source.contestPath ?? ''] as const,
  historySnapshot: (
    source: { id: string; layout?: TournamentLayout; contestPath?: string },
    date: string,
  ) =>
    [
      'history-snapshot',
      source.id,
      source.layout ?? 'legacy',
      source.contestPath ?? '',
      date,
    ] as const,
}
