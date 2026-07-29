<script setup lang="ts">
import { ref } from 'vue'
import { IconBallAmericanFootball, IconBallBasketball } from '@tabler/icons-vue'
import AppHeader from '@/components/AppHeader.vue'
import TeamProbabilityList from '@/components/TeamProbabilityList.vue'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { formatPercent } from '@/lib/utils'
import eplData from '@/data/epl-26-27.json'
import serieAData from '@/data/serie-a-26-27.json'
import laLigaData from '@/data/la-liga-26-27.json'
import bundesligaData from '@/data/bundesliga-26-27.json'
import nflSuperBowlData from '@/data/nfl-super-bowl-26-27.json'
import nbaData from '@/data/nba-26-27.json'
import nhlStanleyCupData from '@/data/nhl-stanley-cup-26-27.json'

interface LeagueEntry {
  team: string
  win_predict: number
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
  { title: 'EPL 26/27', teams: toTeams(eplData) },
  { title: 'Serie A 26/27', teams: toTeams(serieAData) },
  { title: 'La Liga 26/27', teams: toTeams(laLigaData) },
  { title: 'Bundesliga 26/27', teams: toTeams(bundesligaData) },
  { title: 'NFL Super Bowl 26/27', teams: toTeams(nflSuperBowlData), icon: IconBallAmericanFootball },
  { title: 'NBA 26/27', teams: toTeams(nbaData), icon: IconBallBasketball },
  { title: 'NHL Stanley Cup 26/27', teams: toTeams(nhlStanleyCupData), icon: IconBallBasketball },
]

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
