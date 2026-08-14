<script setup lang="ts">
import type { Component } from 'vue'
import { computed, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconBallFootball } from '@onlyzoran/win-predict-ai-icons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@onlyzoran/win-predict-ai-ui'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import MlbPlayoffBracket from '@/components/MlbPlayoffBracket.vue'
import StandingsRankChart from '@/components/StandingsRankChart.vue'
import WinProbabilityPieChart from '@/components/WinProbabilityPieChart.vue'
import { useLeagueHistoryRanks } from '@/composables/useLeagueHistoryRanks'
import type { TeamProbability, TournamentLayout } from '@/types/league'
import { locale } from '@/i18n'
import { canBuildMlbBracket } from '@/lib/mlbPlayoffBracket'
import { abbreviateGroup, formatRecord, formatWinPercent, hasWinsStandings } from '@/lib/standings'
import { formatDate, formatPercent, formatSeason, getDaysSince, getDaysUntil } from '@/lib/utils'

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
const showStandings = computed(() => hasWinsStandings(teams.value))
const showPlayoffBracket = computed(
  () => !props.compact && props.showChart && canBuildMlbBracket(teams.value),
)
const showTabs = computed(() => props.showChart && !props.compact)
const showRankChart = computed(() => Boolean(rankSeries.value))
const overviewGridClass =
  'grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,240px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)]'

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

      <Tabs v-if="showTabs" default-value="overview" class="mt-6">
        <TabsList>
          <TabsTrigger value="overview">{{ t('tournament.tabs.overview') }}</TabsTrigger>
          <TabsTrigger v-if="showRankChart" value="rank">
            {{ t('standings.rankMovement') }}
          </TabsTrigger>
          <TabsTrigger v-if="showPlayoffBracket" value="playoff">
            {{ t('playoff.title') }}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div :class="overviewGridClass">
            <div v-if="showStandings" class="min-w-0 overflow-x-auto">
              <table class="w-full table-fixed border-collapse text-sm md:min-w-[34rem]">
                <colgroup>
                  <col />
                  <col class="hidden w-11 md:table-column" />
                  <col class="hidden w-9 md:table-column" />
                  <col class="hidden w-10 md:table-column" />
                  <col class="w-16 md:w-14" />
                  <col class="hidden w-11 md:table-column" />
                  <col class="w-16 md:w-14" />
                </colgroup>
                <thead>
                  <tr class="text-xs font-medium text-muted-foreground">
                    <th class="pb-2 pr-3 text-left font-medium">{{ t('standings.team') }}</th>
                    <th class="hidden pb-2 text-center font-medium md:table-cell">
                      {{ t('standings.conf') }}
                    </th>
                    <th class="hidden pb-2 text-center font-medium md:table-cell">
                      {{ t('standings.pos') }}
                    </th>
                    <th class="hidden pb-2 text-center font-medium md:table-cell">
                      {{ t('standings.gp') }}
                    </th>
                    <th class="pb-2 text-center font-medium">{{ t('standings.record') }}</th>
                    <th class="hidden pb-2 text-center font-medium md:table-cell">
                      {{ t('standings.pct') }}
                    </th>
                    <th class="pb-2 text-center font-medium">{{ t('standings.winChance') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(team, index) in teams"
                    :key="team.id"
                    class="border-border"
                    :class="index < teams.length - 1 ? 'border-b' : undefined"
                  >
                    <td class="truncate py-2 pr-3 font-medium">{{ team.name }}</td>
                    <td
                      class="hidden py-2 text-center tabular-nums text-muted-foreground md:table-cell"
                    >
                      {{ team.standings ? abbreviateGroup(team.standings.group) : '—' }}
                    </td>
                    <td
                      class="hidden py-2 text-center tabular-nums text-muted-foreground md:table-cell"
                    >
                      {{ team.standings?.playoffSeed || '—' }}
                    </td>
                    <td
                      class="hidden py-2 text-center tabular-nums text-muted-foreground md:table-cell"
                    >
                      {{ team.standings?.played ?? '—' }}
                    </td>
                    <td class="py-2 text-center tabular-nums text-muted-foreground">
                      <template v-if="team.standings">
                        {{ formatRecord(team.standings.wins, team.standings.losses) }}
                      </template>
                      <template v-else>—</template>
                    </td>
                    <td
                      class="hidden py-2 text-center tabular-nums text-muted-foreground md:table-cell"
                    >
                      {{ team.standings ? formatWinPercent(team.standings.winPercent) : '—' }}
                    </td>
                    <td class="py-2">
                      <div class="flex justify-center">
                        <Badge variant="secondary" class="shrink-0">
                          {{ formatPercent(team.winProbability) }}
                        </Badge>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else>
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

            <WinProbabilityPieChart :teams="teams" class="md:sticky md:top-20" />
          </div>
        </TabsContent>

        <TabsContent v-if="showRankChart" value="rank">
          <StandingsRankChart :series="rankSeries!" class="w-full" />
        </TabsContent>

        <TabsContent v-if="showPlayoffBracket" value="playoff">
          <MlbPlayoffBracket :teams="teams" class="w-full" />
        </TabsContent>
      </Tabs>

      <div
        v-else
        class="mt-6"
        :class="showChart ? overviewGridClass : undefined"
      >
        <div v-if="showStandings" class="min-w-0 overflow-x-auto">
          <table
            class="w-full table-fixed border-collapse text-sm"
            :class="compact ? undefined : 'md:min-w-[34rem]'"
          >
            <colgroup>
              <col />
              <template v-if="!compact">
                <col class="hidden w-11 md:table-column" />
                <col class="hidden w-9 md:table-column" />
                <col class="hidden w-10 md:table-column" />
              </template>
              <col class="w-16 md:w-14" />
              <col v-if="!compact" class="hidden w-11 md:table-column" />
              <col class="w-16 md:w-14" />
            </colgroup>
            <thead>
              <tr class="text-xs font-medium text-muted-foreground">
                <th class="pb-2 pr-3 text-left font-medium">{{ t('standings.team') }}</th>
                <template v-if="!compact">
                  <th class="hidden pb-2 text-center font-medium md:table-cell">
                    {{ t('standings.conf') }}
                  </th>
                  <th class="hidden pb-2 text-center font-medium md:table-cell">
                    {{ t('standings.pos') }}
                  </th>
                  <th class="hidden pb-2 text-center font-medium md:table-cell">
                    {{ t('standings.gp') }}
                  </th>
                </template>
                <th class="pb-2 text-center font-medium">{{ t('standings.record') }}</th>
                <th v-if="!compact" class="hidden pb-2 text-center font-medium md:table-cell">
                  {{ t('standings.pct') }}
                </th>
                <th class="pb-2 text-center font-medium">{{ t('standings.winChance') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(team, index) in teams"
                :key="team.id"
                class="border-border"
                :class="index < teams.length - 1 ? 'border-b' : undefined"
              >
                <td class="truncate py-2 pr-3 font-medium">{{ team.name }}</td>
                <template v-if="!compact">
                  <td
                    class="hidden py-2 text-center tabular-nums text-muted-foreground md:table-cell"
                  >
                    {{ team.standings ? abbreviateGroup(team.standings.group) : '—' }}
                  </td>
                  <td
                    class="hidden py-2 text-center tabular-nums text-muted-foreground md:table-cell"
                  >
                    {{ team.standings?.playoffSeed || '—' }}
                  </td>
                  <td
                    class="hidden py-2 text-center tabular-nums text-muted-foreground md:table-cell"
                  >
                    {{ team.standings?.played ?? '—' }}
                  </td>
                </template>
                <td class="py-2 text-center tabular-nums text-muted-foreground">
                  <template v-if="team.standings">
                    {{ formatRecord(team.standings.wins, team.standings.losses) }}
                  </template>
                  <template v-else>—</template>
                </td>
                <td
                  v-if="!compact"
                  class="hidden py-2 text-center tabular-nums text-muted-foreground md:table-cell"
                >
                  {{ team.standings ? formatWinPercent(team.standings.winPercent) : '—' }}
                </td>
                <td class="py-2">
                  <div class="flex justify-center">
                    <Badge variant="secondary" class="shrink-0">
                      {{ formatPercent(team.winProbability) }}
                    </Badge>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else>
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
  </div>
</template>
