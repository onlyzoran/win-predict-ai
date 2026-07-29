<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import TeamProbabilityList from '@/components/TeamProbabilityList.vue'
import eplData from '@/data/epl-26-27.json'
import serieAData from '@/data/serie-a-26-27.json'
import laLigaData from '@/data/la-liga-26-27.json'
import bundesligaData from '@/data/bundesliga-26-27.json'

const eplTeams = eplData.map((entry, index) => ({
  id: String(index + 1),
  name: entry.team,
  winProbability: entry.win_predict,
}))

const serieATeams = serieAData.map((entry, index) => ({
  id: String(index + 1),
  name: entry.team,
  winProbability: entry.win_predict,
}))

const laLigaTeams = laLigaData.map((entry, index) => ({
  id: String(index + 1),
  name: entry.team,
  winProbability: entry.win_predict,
}))

const bundesligaTeams = bundesligaData.map((entry, index) => ({
  id: String(index + 1),
  name: entry.team,
  winProbability: entry.win_predict,
}))
</script>

<template>
  <div class="min-h-screen flex flex-col bg-background">
    <AppHeader />
    <main class="flex-1 flex items-start justify-center pt-14 gap-4">
      <TeamProbabilityList
        title="EPL 26/27"
        :teams="eplTeams"
        class="flex flex-col "
      />
      <TeamProbabilityList
        title="Serie A 26/27"
        :teams="serieATeams"
      />
      <TeamProbabilityList
        title="La Liga 26/27"
        :teams="laLigaTeams"
      />
      <TeamProbabilityList
        title="Bundesliga 26/27"
        :teams="bundesligaTeams"
      />
    </main>
  </div>
</template>
