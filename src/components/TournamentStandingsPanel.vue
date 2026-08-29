<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import WinProbabilityPieChart from '@/components/WinProbabilityPieChart.vue'
import type { TeamProbability } from '@/types/league'
import { abbreviateGroup, formatRecord, formatWinPercent, hasWinsStandings } from '@/lib/standings'
import { formatPercent } from '@/lib/utils'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    teams: TeamProbability[]
    compact?: boolean
    showChart?: boolean
    predictionsOnly?: boolean
  }>(),
  {
    compact: false,
    showChart: false,
    predictionsOnly: false,
  },
)

const { t } = useI18n()
const showStandings = computed(() => !props.predictionsOnly && hasWinsStandings(props.teams))
</script>

<template>
  <div
    :class="
      showChart
        ? 'grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,240px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)]'
        : undefined
    "
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
              <td class="hidden py-2 text-center tabular-nums text-muted-foreground md:table-cell">
                {{ team.standings ? abbreviateGroup(team.standings.group) : '—' }}
              </td>
              <td class="hidden py-2 text-center tabular-nums text-muted-foreground md:table-cell">
                {{ team.standings?.playoffSeed || '—' }}
              </td>
              <td class="hidden py-2 text-center md:table-cell">
                <span
                  v-if="team.standings?.played != null"
                  class="inline-flex min-w-10 items-center justify-center rounded-md bg-outcome-intermediate px-1.5 py-0.5 tabular-nums text-xs font-semibold text-outcome-intermediate-foreground"
                >
                  {{ team.standings.played }}
                </span>
                <template v-else>—</template>
              </td>
            </template>
            <td class="py-2 text-center">
              <span
                v-if="team.standings"
                class="inline-flex min-w-14 items-center justify-center rounded-md bg-outcome-final px-2 py-0.5 tabular-nums text-xs font-semibold text-outcome-final-foreground"
              >
                {{ formatRecord(team.standings.wins, team.standings.losses) }}
              </span>
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
</template>
