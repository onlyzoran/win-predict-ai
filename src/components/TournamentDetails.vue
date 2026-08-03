<script setup lang="ts">
import type { Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconBallFootball } from '@tabler/icons-vue'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import WinProbabilityPieChart from '@/components/WinProbabilityPieChart.vue'
import type { TeamProbability } from '@/types/league'
import { locale } from '@/i18n'
import { formatDate, formatPercent, formatSeason } from '@/lib/utils'

withDefaults(
  defineProps<{
    title: string
    fullTitle?: string
    teams: TeamProbability[]
    progress?: number
    startDate?: string
    endDate?: string
    icon?: Component
    showChart?: boolean
  }>(),
  {
    fullTitle: undefined,
    progress: 0,
    startDate: '',
    endDate: '',
    icon: () => IconBallFootball,
    showChart: false,
  },
)

const { t } = useI18n()
</script>

<template>
  <div>
    <div class="space-y-2">
      <h2 class="flex items-center gap-2 text-lg font-semibold leading-none">
        <component :is="icon" class="size-4" />
        {{ fullTitle || title }}
      </h2>
      <p class="text-sm text-muted-foreground">
        {{ t('team.season') }}
        {{ formatSeason(startDate, endDate) }}
      </p>
      <Progress :model-value="progress" class="h-1" />
      <div class="flex items-center justify-between text-xs text-muted-foreground">
        <span>{{ formatDate(startDate, locale) }}</span>
        <span>{{ formatDate(endDate, locale) }}</span>
      </div>
    </div>

    <div
      class="mt-6"
      :class="
        showChart
          ? 'grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,240px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)]'
          : undefined
      "
    >
      <div>
        <div v-for="(team, index) in teams" :key="team.id">
          <div class="flex items-center justify-between gap-3 py-2">
            <span class="truncate font-medium">{{ team.name }}</span>
            <Badge variant="secondary" class="shrink-0">
              {{ formatPercent(team.winProbability) }}
            </Badge>
          </div>
          <Separator v-if="index < teams.length - 1" />
        </div>
      </div>

      <WinProbabilityPieChart v-if="showChart" :teams="teams" class="md:sticky md:top-20" />
    </div>
  </div>
</template>
