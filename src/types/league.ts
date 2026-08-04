import type { Component } from 'vue'
import type { Sport } from '@/types/sport'

export interface LeagueEntry {
  team: string
  win_predict: number
}

export interface LeagueManifest {
  id: string
  title: string
  fullTitle?: string
  sport: Sport
  file: string
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
