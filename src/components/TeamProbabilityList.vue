<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface TeamProbability {
  id: string
  name: string
  winProbability: number // 0–100
}

defineProps<{
  title: string
  teams: TeamProbability[]
}>()
</script>

<template>
  <Card class="w-full max-w-2xs p-0">
    <CardHeader class="px-4 pt-4">
      <CardTitle>{{ title }}</CardTitle>
    </CardHeader>
    <CardContent class="p-0">
      <div
        v-for="(team, index) in teams"
        :key="team.id"
      >
        <div class="flex items-center justify-between px-4 py-2">
          <span class="font-medium">{{ team.name }}</span>
          <Badge variant="secondary">
            {{ team.winProbability.toFixed(1) }}%
          </Badge>
        </div>
        <Separator v-if="index < teams.length - 1" />
      </div>
    </CardContent>
  </Card>
</template>
