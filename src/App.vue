<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import TeamProbabilityList from '@/components/TeamProbabilityList.vue'
import eplData from '@/data/epl-26-27.json'
import serieAData from '@/data/serie-a-26-27.json'
import laLigaData from '@/data/la-liga-26-27.json'
import bundesligaData from '@/data/bundesliga-26-27.json'

interface LeagueEntry {
  team: string
  win_predict: number
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
]
</script>

<template>
  <div class="min-h-screen flex flex-col bg-background">
    <AppHeader />
    <main class="flex-1 flex flex-wrap items-start justify-center pt-14 gap-4">
      <TeamProbabilityList
        v-for="league in leagues"
        :key="league.title"
        :title="league.title"
        :teams="league.teams"
      />
    </main>
  </div>
</template>
