<script setup lang="ts">
import { ref } from 'vue'
import { IconBallAmericanFootball, IconBallBasketball } from '@tabler/icons-vue'
import AppHeader from '@/components/AppHeader.vue'
import TeamProbabilityList from '@/components/TeamProbabilityList.vue'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { formatPercent, getTournamentProgress } from '@/lib/utils'
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

function getProgress(id: string) {
  const dates = tournamentDates.find((tournament) => tournament.id === id)

  if (!dates) {
    return 0
  }

  return getTournamentProgress(dates.startDate, dates.endDate, dates.endDateTo)
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
].map((league) => ({ ...league, progress: getProgress(league.id) }))

const isDetailsOpen = ref(false)
const selectedLeague = ref<{ title: string, teams: TeamProbability[] } | null>(null)

function handleDetails(league: { title: string, teams: TeamProbability[] }) {
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
        :icon="'icon' in league ? league.icon : undefined"
        @details="handleDetails"
      />
    </main>

    <Sheet v-model:open="isDetailsOpen">
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{{ selectedLeague?.title }}</SheetTitle>
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
