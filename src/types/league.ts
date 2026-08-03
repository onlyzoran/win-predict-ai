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

export interface TeamProbability {
  id: string
  name: string
  winProbability: number
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
