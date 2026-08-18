<script setup lang="ts">
import type { Component } from 'vue'
import { computed, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  IconArrowsSort,
  IconBallBaseball,
  IconBallFootball,
  IconCircleFilled,
} from '@onlyzoran/win-predict-ai-icons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@onlyzoran/win-predict-ai-ui'
import { Progress } from '@/components/ui/progress'
import MlbPlayoffBracket from '@/components/MlbPlayoffBracket.vue'
import StandingsRankChart from '@/components/StandingsRankChart.vue'
import TournamentStandingsPanel from '@/components/TournamentStandingsPanel.vue'
import { useLeagueHistoryRanks } from '@/composables/useLeagueHistoryRanks'
import type { TeamProbability, TournamentLayout } from '@/types/league'
import { locale } from '@/i18n'
import { canBuildMlbBracket } from '@/lib/mlbPlayoffBracket'
import { formatDate, formatSeason, getDaysSince, getDaysUntil } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    title: string
    fullTitle?: string
    teams: TeamProbability[]
    progress?: number
    startDate?: string
    endDate?: string
    icon?: Component
    showChart?: boolean
    compact?: boolean
    leagueId?: string
    layout?: TournamentLayout
    contestPath?: string
  }>(),
  {
    fullTitle: undefined,
    progress: 0,
    startDate: '',
    endDate: '',
    icon: () => IconBallFootball,
    showChart: false,
    compact: false,
    leagueId: undefined,
    layout: 'legacy',
    contestPath: undefined,
  },
)

const { startDate, endDate, teams } = toRefs(props)
const { t } = useI18n()

const useTabbedLayout = computed(() => props.showChart && !props.compact)

const historySource = computed(() =>
  props.showChart && !props.compact && props.leagueId
    ? {
        id: props.leagueId,
        layout: props.layout,
        contestPath: props.contestPath,
      }
    : undefined,
)
const { series: rankSeries } = useLeagueHistoryRanks(historySource)

const daysUntilStart = computed(() => getDaysUntil(startDate.value))
const daysUntilEnd = computed(() => getDaysUntil(endDate.value))
const daysSinceStart = computed(() => getDaysSince(startDate.value))
const showPlayoffBracket = computed(
  () => !props.compact && props.showChart && canBuildMlbBracket(teams.value),
)
const showRankMovementTab = computed(() => Boolean(rankSeries.value))

const startCountdownLabel = computed(() => {
  if (daysUntilStart.value === null) {
    return null
  }

  if (daysUntilStart.value > 0) {
    return t('team.daysUntilStart', daysUntilStart.value)
  }

  if (daysUntilEnd.value !== null && daysUntilEnd.value > 0 && (daysSinceStart.value ?? 0) > 0) {
    return t('team.daysSinceStart', daysSinceStart.value!)
  }

  return t('team.started')
})
</script>

<template>
  <div class="w-full">
    <div :class="showChart ? 'mx-auto w-full max-w-6xl' : undefined">
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
          <span>
            {{ formatDate(startDate, locale) }}
            <template v-if="!compact && startCountdownLabel !== null">
              ({{ startCountdownLabel }})
            </template>
          </span>
          <span>
            {{ formatDate(endDate, locale) }}
            <template v-if="!compact && daysUntilEnd !== null">
              ({{ daysUntilEnd === 0 ? t('team.ended') : t('team.daysUntilEnd', daysUntilEnd) }})
            </template>
          </span>
        </div>
      </div>

      <div v-if="!useTabbedLayout" class="mt-6">
        <TournamentStandingsPanel :teams="teams" :compact="compact" :show-chart="showChart" />
      </div>
    </div>

    <Tabs v-if="useTabbedLayout" default-value="standings" class="mt-6 w-full">
      <section class="flex justify-center px-4">
        <TabsList class="w-fit max-w-full" :aria-label="t('tournament.tabs.sections')">
          <TabsTrigger value="standings" variant="with-icon">
            <IconCircleFilled aria-hidden="true" class="size-4" />
            {{ t('standings.title') }}
          </TabsTrigger>
          <TabsTrigger v-if="showRankMovementTab" value="movement" variant="with-icon">
            <IconArrowsSort aria-hidden="true" />
            {{ t('standings.rankMovement') }}
          </TabsTrigger>
          <TabsTrigger v-if="showPlayoffBracket" value="playoff" variant="with-icon">
            <IconBallBaseball aria-hidden="true" />
            {{ t('playoff.title') }}
          </TabsTrigger>
        </TabsList>
      </section>

      <TabsContent value="standings" class="mt-4 space-y-4 px-4">
        <div class="mx-auto w-full max-w-6xl">
          <TournamentStandingsPanel :teams="teams" :show-chart="showChart" />
        </div>
      </TabsContent>

      <TabsContent v-if="showRankMovementTab" value="movement" class="mt-4 w-full">
        <StandingsRankChart :series="rankSeries!" class="w-full" />
      </TabsContent>

      <TabsContent v-if="showPlayoffBracket" value="playoff" class="mt-4 w-full px-4">
        <div class="mx-auto w-full max-w-6xl">
          <MlbPlayoffBracket :teams="teams" class="w-full" />
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
