<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import TeamProbabilityList from '@/components/TeamProbabilityList.vue'
import eplData from '@/data/epl-26-27.json'

const teams = eplData.map((entry, index) => ({
  id: String(index + 1),
  name: entry.team,
  winProbability: entry.win_predict,
}))
</script>

<template>
  <div class="min-h-screen flex flex-col bg-background">
    <AppHeader />
    <main class="flex-1 flex items-center justify-center pt-14">
      <TeamProbabilityList
        title="England Premier League 2026/2027"
        :teams="teams"
      />
    </main>
  </div>
</template>
