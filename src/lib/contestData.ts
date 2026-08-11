import type {
  ContestFactsFile,
  ContestFactsIndex,
  ContestParticipant,
  ContestParticipantsFile,
  ContestPredictionFile,
  LeagueEntry,
  LeagueHistoryDays,
  LeagueHistorySnapshot,
  StandingRow,
} from '@/types/league'

export function buildParticipantNameMap(
  participants: ContestParticipant[],
): Map<string, string> {
  return new Map(participants.map((participant) => [participant.id, participant.name]))
}

export function resolveParticipantName(
  participantId: string,
  names: Map<string, string>,
): string {
  return names.get(participantId) ?? participantId
}

export function predictionToEntries(
  prediction: ContestPredictionFile,
  participants: ContestParticipantsFile,
): LeagueEntry[] {
  const names = buildParticipantNameMap(participants.participants)
  return prediction.items.map((item) => ({
    participantId: item.participantId,
    team: resolveParticipantName(item.participantId, names),
    win_predict: item.probability,
  }))
}

export function factsRowsToStandings(
  rows: ContestFactsFile['rows'],
  participants: ContestParticipantsFile,
): StandingRow[] {
  const names = buildParticipantNameMap(participants.participants)
  return rows.map((row) => ({
    participantId: row.participantId,
    team: resolveParticipantName(row.participantId, names),
    played: row.played,
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
    points: row.points,
    winPercent: row.winPercent,
    playoffSeed: row.playoffSeed,
    group: row.group ?? '',
    rank: row.rank,
    sourceRank: row.sourceRank,
  }))
}

export function factsToStandingRows(
  facts: ContestFactsFile,
  participants: ContestParticipantsFile,
): StandingRow[] {
  return factsRowsToStandings(facts.rows, participants)
}

export function factsToHistorySnapshot(
  facts: ContestFactsFile,
  participants: ContestParticipantsFile,
): LeagueHistorySnapshot {
  return {
    leagueId: facts.contestId,
    date: facts.date,
    metric: facts.metric,
    standings: factsToStandingRows(facts, participants),
  }
}

export function factsIndexToHistoryDays(index: ContestFactsIndex): LeagueHistoryDays {
  return {
    leagueId: index.contestId,
    count: index.count,
    first: index.first,
    last: index.last,
    days: index.days,
  }
}

/** Resolve a dated standings file path relative to `{contestPath}/facts/`. */
export function resolveContestStandingsRelativePath(
  index: ContestFactsIndex,
  date: string,
): string {
  if (index.grain === 'matchday' && index.tours?.length) {
    for (const tour of index.tours) {
      if (tour.slices.includes(date)) {
        const tourFolder = `tour-${String(tour.tour).padStart(2, '0')}`
        return `standings/${tourFolder}/${date}.json`
      }
    }
  }

  return `standings/${date}.json`
}
