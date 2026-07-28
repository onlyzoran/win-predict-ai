<script setup lang="ts">
import TeamProbabilityList from '@/components/TeamProbabilityList.vue'

const teams = [
  { id: '1', name: 'Flamengo', winProbability: 34.2 },
  { id: '2', name: 'Palmeiras', winProbability: 21.7 },
  { id: '3', name: 'Botafogo', winProbability: 12.4 },
]
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <TeamProbabilityList :teams="teams" />
  </div>
</template>
