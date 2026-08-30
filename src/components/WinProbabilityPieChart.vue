<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Donut } from '@unovis/ts'
import { VisDonut, VisSingleContainer } from '@unovis/vue'
import type { ChartConfig } from '@/components/ui/chart'
import { ChartContainer, ChartTooltip, componentToString } from '@/components/ui/chart'
import type { TeamProbability } from '@/types/league'
import { useColorPalette } from '@/composables/useColorPalette'
import { useChartThemeRevision } from '@/composables/useChartThemeColors'
import {
  CHART_COLORS,
  getOthersChartColor,
  getTeamChartColor,
} from '@/lib/chartThemeColors'
import { shortTeamName } from '@onlyzoran/win-predict-ai-ui'
import { aggregateTopTeams, TOP_TEAMS_COUNT } from '@/lib/teamProbability'
import WinProbabilityPieTooltip from '@/components/WinProbabilityPieTooltip.vue'
import { formatPercent } from '@/lib/utils'

interface PieSlice {
  key: string
  name: string
  winProbability: number
  fill: string
}

const props = defineProps<{
  teams: TeamProbability[]
}>()

const { t } = useI18n()
const { isDark } = useColorPalette()
const chartThemeRevision = useChartThemeRevision()

const slices = computed<PieSlice[]>(() => {
  void chartThemeRevision.value

  const restCount = Math.max(0, props.teams.length - TOP_TEAMS_COUNT)
  const aggregated = aggregateTopTeams(props.teams, {
    topN: TOP_TEAMS_COUNT,
    othersLabel: t('team.others', { count: restCount }),
  })

  return aggregated.map((team, index) => {
    const key = team.id === 'rest' ? 'others' : `team-${team.id}`
    const fill =
      team.id === 'rest'
        ? getOthersChartColor(isDark.value)
        : (getTeamChartColor(index) ?? CHART_COLORS[0])

    return {
      key,
      name: team.name,
      winProbability: team.winProbability,
      fill,
    }
  })
})

const chartConfig = computed(() => {
  const config: ChartConfig = {}

  for (const slice of slices.value) {
    config[slice.key] = {
      label: slice.name,
      color: slice.fill,
    }
  }

  return config
})

const valueAccessor = (d: PieSlice) => d.winProbability
const colorAccessor = (d: PieSlice) => d.fill

const tooltipTriggers = {
  [Donut.selectors.segment]: componentToString({}, WinProbabilityPieTooltip)!,
}
</script>

<template>
  <div data-testid="win-probability-pie" class="w-full space-y-4">
    <ChartContainer :config="chartConfig" class="mx-auto aspect-square max-h-[260px] w-full">
      <VisSingleContainer :key="chartThemeRevision" :data="slices" :margin="{ top: 4, bottom: 4 }">
        <VisDonut :value="valueAccessor" :color="colorAccessor" :arc-width="28" />
        <ChartTooltip :triggers="tooltipTriggers" />
      </VisSingleContainer>
    </ChartContainer>

    <ul class="grid gap-2 text-sm">
      <li v-for="slice in slices" :key="slice.key" class="flex items-center justify-between gap-3">
        <span class="flex min-w-0 items-center gap-2">
          <span
            class="size-2.5 shrink-0 rounded-xs"
            :style="{ backgroundColor: slice.fill }"
            aria-hidden="true"
          />
          <span class="truncate font-medium" :title="slice.name">
            <template v-if="slice.key === 'others'">{{ slice.name }}</template>
            <template v-else>
              <span class="md:hidden">{{ shortTeamName(slice.name) }}</span>
              <span class="hidden md:inline">{{ slice.name }}</span>
            </template>
          </span>
        </span>
        <span class="shrink-0 text-muted-foreground tabular-nums">
          {{ formatPercent(slice.winProbability) }}
        </span>
      </li>
    </ul>
  </div>
</template>
