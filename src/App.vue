<script setup lang="ts">
import { ref } from 'vue'
import type { Component } from 'vue'
import { IconBallAmericanFootball, IconBallBasketball, IconBallFootball } from '@tabler/icons-vue'
import AppHeader from '@/components/AppHeader.vue'
import TeamProbabilityList from '@/components/TeamProbabilityList.vue'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Progress } from '@/components/ui/progress'
import { locale } from '@/i18n'
import { formatDate, formatPercent, getTournamentProgress } from '@/lib/utils'
import eplData from '@/data/epl-26-27.json'
import serieAData from '@/data/serie-a-26-27.json'
import laLigaData from '@/data/la-liga-26-27.json'
import bundesligaData from '@/data/bundesliga-26-27.json'
import rplData from '@/data/rpl-26-27.json'
import nflSuperBowlData from '@/data/nfl-super-bowl-26-27.json'
import nbaData from '@/data/nba-26-27.json'
import nhlStanleyCupData from '@/data/nhl-stanley-cup-26-27.json'
import tournamentDates from '@/data/tournament-dates.json'

interface LeagueEntry {
  team: string
  win_predict: number
}

function getDates(id: string) {
  const dates = tournamentDates.find((tournament) => tournament.id === id)

  if (!dates) {
    return { progress: 0, startDate: '', endDate: '' }
  }

  return {
    progress: getTournamentProgress(dates.startDate, dates.endDate, dates.endDateTo),
    startDate: dates.startDate,
    endDate: dates.endDateTo || dates.endDate,
  }
}

interface TeamProbability {
  id: string
  name: string
  winProbability: number
}

function toTeams(entries: LeagueEntry[]) {
  return entries.map((entry, index) => ({
    id: String(index + 1),
    name: entry.team,
    winProbability: entry.win_predict,
  }))
}

const leagues = [
  { id: 'epl-26-27', title: 'EPL 26/27', teams: toTeams(eplData) },
  { id: 'serie-a-26-27', title: 'Serie A 26/27', teams: toTeams(serieAData) },
  { id: 'la-liga-26-27', title: 'La Liga 26/27', teams: toTeams(laLigaData) },
  { id: 'bundesliga-26-27', title: 'Bundesliga 26/27', teams: toTeams(bundesligaData) },
  { id: 'rpl-26-27', title: 'RPL 26/27', teams: toTeams(rplData) },
  { id: 'nfl-super-bowl-26-27', title: 'NFL Super Bowl 26/27', teams: toTeams(nflSuperBowlData), icon: IconBallAmericanFootball },
  { id: 'nba-26-27', title: 'NBA 26/27', teams: toTeams(nbaData), icon: IconBallBasketball },
  { id: 'nhl-stanley-cup-26-27', title: 'NHL Stanley Cup 26/27', teams: toTeams(nhlStanleyCupData), icon: IconBallBasketball },
].map((league) => ({ ...league, ...getDates(league.id) }))

interface SelectedLeague {
  title: string
  teams: TeamProbability[]
  progress: number
  startDate: string
  endDate: string
  icon: Component
}

const isDetailsOpen = ref(false)
const selectedLeague = ref<SelectedLeague | null>(null)

function handleDetails(league: SelectedLeague) {
  selectedLeague.value = league
  isDetailsOpen.value = true
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-background">
    <AppHeader />
    <main class="flex-1 flex flex-wrap items-start justify-start pt-16 px-4 gap-4">
      <TeamProbabilityList
        v-for="league in leagues"
        :key="league.title"
        :title="league.title"
        :teams="league.teams"
        :progress="league.progress"
        :start-date="league.startDate"
        :end-date="league.endDate"
        :icon="'icon' in league ? league.icon : undefined"
        @details="handleDetails"
      />
    </main>

    <Sheet v-model:open="isDetailsOpen">
      <SheetContent>
        <SheetHeader>
          <SheetTitle class="flex items-center gap-2">
            <component :is="selectedLeague?.icon ?? IconBallFootball" class="size-4" />
            {{ selectedLeague?.title }}
          </SheetTitle>
          <Progress :model-value="selectedLeague?.progress ?? 0" class="mt-2 h-1" />
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>{{ formatDate(selectedLeague?.startDate ?? '', locale) }}</span>
            <span>{{ formatDate(selectedLeague?.endDate ?? '', locale) }}</span>
          </div>
        </SheetHeader>
        <div class="overflow-y-auto px-4">
          <div
            v-for="(team, index) in selectedLeague?.teams ?? []"
            :key="team.id"
          >
            <div class="flex items-center justify-between py-2">
              <span class="font-medium">{{ team.name }}</span>
              <Badge variant="secondary">
                {{ formatPercent(team.winProbability) }}
              </Badge>
            </div>
            <Separator v-if="selectedLeague && index < selectedLeague.teams.length - 1" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
