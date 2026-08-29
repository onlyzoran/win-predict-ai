import type { Component } from 'vue'
import type { Sport } from '@/types/sport'

export type TournamentLayout = 'legacy' | 'contests'

export interface LeagueEntry {
  team: string
  win_predict: number
  /** Stable id when loaded from contests layout. */
  participantId?: string
}

export interface LeagueManifest {
  id: string
  title: string
  fullTitle?: string
  sport: Sport
  /** Legacy prediction JSON under data/, e.g. `ucl-26-27.json`. */
  file?: string
  /** `"contests"` for migrated contests; omit/legacy for file-based leagues. */
  layout?: TournamentLayout
  /** Folder under data/, e.g. `contests/rpl-26-27`. */
  contestPath?: string
  startDate: string
  endDate: string
  endDateTo?: string
  popularPriority: number
}

export interface StandingRow {
  team: string
  played?: number
  wins?: number
  losses?: number
  winPercent?: number
  playoffSeed?: number
  group: string
  points?: number
  draws?: number
  rank?: number
  sourceRank?: number
  participantId?: string
  goalsFor?: number
  goalsAgainst?: number
  goalDifference?: number
}

export interface TournamentFactsSnapshot {
  date: string
  metric: string
  rows: StandingRow[]
  fetchedAt?: string
}

export interface LeagueHistorySnapshot {
  leagueId: string
  date: string
  metric: string
  standings: StandingRow[]
}

export interface LeagueHistoryDays {
  leagueId: string
  count: number
  first: string
  last: string
  days: string[]
}

export interface ContestParticipant {
  id: string
  name: string
  aliases?: string[]
}

export interface ContestParticipantsFile {
  contestId: string
  participants: ContestParticipant[]
}

export interface ContestPredictionItem {
  participantId: string
  probability: number
}

export interface ContestPredictionFile {
  kind: 'prediction'
  contestId: string
  date: string
  items: ContestPredictionItem[]
}

export interface ContestPredictionCardItem {
  participantId: string
  name: string
  probability: number
  othersCount?: number
}

export interface ContestPredictionCardFile {
  kind: 'predictionCard'
  contestId: string
  date: string
  generatedAt?: string
  basedOnFactsDate?: string
  basedOnTour?: number | null
  target?: string
  unit?: string
  topN?: number
  items: ContestPredictionCardItem[]
}

export interface ContestFactsRow {
  participantId: string
  played?: number
  wins?: number
  draws?: number
  losses?: number
  points?: number
  winPercent?: number
  playoffSeed?: number
  group?: string
  rank?: number
  sourceRank?: number
  goalsFor?: number
  goalsAgainst?: number
  goalDifference?: number
}

export interface ContestFactsFile {
  kind: 'standings'
  contestId: string
  date: string
  metric: string
  rows: ContestFactsRow[]
}

export interface ContestFactsTour {
  tour: number
  status: string
  slices: string[]
  latestDate: string
  latestFile: string
}

export interface ContestFactsIndex {
  contestId: string
  kind: 'facts'
  factKind: string
  grain?: 'day' | 'matchday'
  count: number
  first: string
  last: string
  days: string[]
  tours?: ContestFactsTour[]
}

export interface TeamStandings {
  group: string
  playoffSeed?: number
  played?: number
  wins: number
  losses: number
  winPercent: number
}

export interface TeamProbability {
  id: string
  name: string
  winProbability: number
  standings?: TeamStandings
  /** Set on pre-aggregated card "others" rows from predictionCard snapshots. */
  othersCount?: number
}

export interface League {
  id: string
  title: string
  fullTitle?: string
  teams: TeamProbability[]
  sport: Sport
  icon: Component
  progress: number
  startDate: string
  endDate: string
  popularPriority: number
  layout: TournamentLayout
  contestPath?: string
}

export interface LeagueSlot {
  id: string
  sport: Sport
  popularPriority: number
  sortTitle: string
  sortEndDate: string
  league: League | null
}

export interface SelectedLeague {
  id: string
  title: string
  fullTitle?: string
  teams: TeamProbability[]
  progress: number
  startDate: string
  endDate: string
  icon?: Component
}
