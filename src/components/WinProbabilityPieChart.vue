<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Donut } from '@unovis/ts'
import { VisDonut, VisSingleContainer } from '@unovis/vue'
import type { ChartConfig } from '@/components/ui/chart'
import { ChartContainer, ChartTooltip, componentToString } from '@/components/ui/chart'
import type { TeamProbability } from '@/types/league'
import {
  aggregateTopTeams,
  CHART_COLORS,
  getTeamChartColor,
  OTHERS_CHART_COLOR,
  TOP_TEAMS_COUNT,
} from '@/lib/teamProbability'
import WinProbabilityPieTooltip from '@/components/WinProbabilityPieTooltip.vue'

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

const slices = computed<PieSlice[]>(() => {
  const restCount = Math.max(0, props.teams.length - TOP_TEAMS_COUNT)
  const aggregated = aggregateTopTeams(props.teams, {
    topN: TOP_TEAMS_COUNT,
    othersLabel: t('team.others', { count: restCount }),
  })

  return aggregated.map((team, index) => {
    const key = team.id === 'rest' ? 'others' : `team-${team.id}`
    const fill =
      team.id === 'rest' ? OTHERS_CHART_COLOR : (getTeamChartColor(index) ?? CHART_COLORS[0])

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
  <div data-testid="win-probability-pie" class="w-full">
    <ChartContainer :config="chartConfig" class="mx-auto aspect-square max-h-[260px] w-full">
      <VisSingleContainer :data="slices" :margin="{ top: 4, bottom: 4 }">
        <VisDonut :value="valueAccessor" :color="colorAccessor" :arc-width="0" />
        <ChartTooltip :triggers="tooltipTriggers" />
      </VisSingleContainer>
    </ChartContainer>
  </div>
</template>
