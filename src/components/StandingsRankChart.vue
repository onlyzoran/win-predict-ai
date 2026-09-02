<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CurveType, Line } from '@unovis/ts'
import { VisAxis, VisLine, VisXYContainer } from '@unovis/vue'
import type { ChartConfig } from '@/components/ui/chart'
import {
  ChartContainer,
  ChartCrosshair,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
} from '@/components/ui/chart'
import { shortTeamName } from '@onlyzoran/win-predict-ai-ui'
import type { RankSeries } from '@/lib/historyRank'
import { locale } from '@/i18n'

/** Plot area height — side labels use the same track. */
const PLOT_HEIGHT_PX = 768
/** Equal vertical inset inside the plot so rank 1 / last rank sit on the line centers. */
const PLOT_INSET_PX = 6

interface SideLabel {
  name: string
  color: string
  rank: number
}

const props = defineProps<{
  series: RankSeries
}>()

const { t } = useI18n()
const plotEl = ref<HTMLElement | null>(null)
const highlightedTeam = ref<string | null>(null)

const teamColor = computed(() => {
  const map = new Map<string, string>()
  for (const team of props.series.teams) {
    map.set(team.name, team.color)
  }
  return map
})

const teamIndex = computed(() => {
  const map = new Map<string, number>()
  props.series.teams.forEach((team, index) => {
    map.set(team.name, index)
  })
  return map
})

const chartConfig = computed(() => {
  const config: ChartConfig = {}
  for (const team of props.series.teams) {
    config[team.name] = {
      label: team.name,
      color: team.color,
    }
  }
  return config
})

const maxRank = computed(() =>
  Math.max(
    props.series.teams.length,
    ...props.series.points.flatMap((point) => Object.values(point.ranks)),
  ),
)

const yDomain = computed<[number, number]>(() => [maxRank.value, 1])

const xAccessor = (d: Record<string, string | number>) => Number(d.x)

const yAccessors = computed(() =>
  props.series.teams.map((team) => (d: Record<string, string | number>) => Number(d[team.name])),
)

const lineColors = computed(() => props.series.teams.map((team) => team.color))

const flatPoints = computed(() =>
  props.series.points.map((point) => {
    const flat: Record<string, string | number> = {
      date: point.date,
      x: point.x,
    }
    for (const team of props.series.teams) {
      const rank = point.ranks[team.name]
      if (rank != null) {
        flat[team.name] = rank
      }
    }
    return flat
  }),
)

function labelsForPoint(point: RankSeries['points'][number] | undefined): SideLabel[] {
  if (!point) {
    return []
  }

  return Object.entries(point.ranks)
    .map(([name, rank]) => ({
      name,
      rank,
      color: teamColor.value.get(name) ?? 'currentColor',
    }))
    .sort((a, b) => a.rank - b.rank)
}

const leftLabels = computed(() => labelsForPoint(props.series.points[0]))
const rightLabels = computed(() =>
  labelsForPoint(props.series.points[props.series.points.length - 1]),
)

const axisDates = computed(() => {
  const points = props.series.points
  if (points.length === 0) {
    return []
  }
  if (points.length <= 6) {
    return points.map((point) => point.date)
  }

  const lastIndex = points.length - 1
  const indexes = new Set<number>()
  for (let i = 0; i < 6; i++) {
    indexes.add(Math.round((i * lastIndex) / 5))
  }
  return [...indexes].sort((a, b) => a - b).map((index) => points[index]!.date)
})

function labelTop(rank: number): string {
  if (maxRank.value <= 1) {
    return `${PLOT_INSET_PX}px`
  }

  const trackHeight = PLOT_HEIGHT_PX - PLOT_INSET_PX * 2
  const top = PLOT_INSET_PX + ((rank - 1) / (maxRank.value - 1)) * trackHeight
  return `${top}px`
}

function formatAxisDate(date: string): string {
  return new Intl.DateTimeFormat(locale.value, { month: 'short', day: 'numeric' }).format(
    new Date(`${date}T00:00:00Z`),
  )
}

function formatTooltipLabel(value: number | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

const tooltipTemplate = computed(
  () =>
    componentToString(chartConfig.value, ChartTooltipContent, {
      labelFormatter: formatTooltipLabel,
    })!,
)

/** Match Unovis VisLine highlightOnHover by toggling the same `dim` class. */
function setHighlightedTeam(teamName: string | null) {
  highlightedTeam.value = teamName
  const root = plotEl.value
  if (!root) {
    return
  }

  const activeIndex = teamName == null ? -1 : (teamIndex.value.get(teamName) ?? -1)
  const lineGroups = root.querySelectorAll(`.${Line.selectors.line}`)

  lineGroups.forEach((element, index) => {
    element.classList.toggle(Line.selectors.dim, activeIndex !== -1 && index !== activeIndex)
  })
}

function labelClass(teamName: string): string {
  const base =
    'absolute flex max-w-full -translate-y-1/2 cursor-pointer items-center gap-1.5 text-[10px] leading-none transition-opacity sm:text-xs'
  if (highlightedTeam.value && highlightedTeam.value !== teamName) {
    return `${base} opacity-30`
  }
  return base
}
</script>

<template>
  <div data-testid="standings-rank-chart" class="w-full min-w-0 space-y-3">
    <h3 class="text-sm font-medium max-md:px-4 md:px-0">{{ t('standings.rankMovement') }}</h3>

    <div class="flex w-full min-w-0 gap-1 md:gap-2">
      <ul
        class="relative w-10 shrink-0 sm:w-11 md:w-36"
        :style="{ height: `${PLOT_HEIGHT_PX}px` }"
        aria-label="Start standings"
      >
        <li
          v-for="team in leftLabels"
          :key="`start-${team.name}`"
          :class="[labelClass(team.name), 'right-0 justify-end text-right']"
          :style="{ top: labelTop(team.rank) }"
          @mouseenter="setHighlightedTeam(team.name)"
          @mouseleave="setHighlightedTeam(null)"
        >
          <span class="truncate font-medium" :style="{ color: team.color }" :title="team.name">
            <span class="md:hidden">{{ shortTeamName(team.name) }}</span>
            <span class="hidden md:inline">{{ team.name }}</span>
          </span>
          <span
            class="size-1.5 shrink-0 rounded-full"
            :style="{ backgroundColor: team.color }"
            aria-hidden="true"
          />
        </li>
      </ul>

      <div class="flex min-w-0 flex-1 flex-col gap-1.5">
        <div ref="plotEl">
          <ChartContainer
            :config="chartConfig"
            class="aspect-auto w-full min-w-0"
            :style="{ height: `${PLOT_HEIGHT_PX}px` }"
          >
            <VisXYContainer
              :data="flatPoints"
              :y-domain="yDomain"
              :auto-margin="false"
              :margin="{
                top: PLOT_INSET_PX,
                right: PLOT_INSET_PX,
                bottom: PLOT_INSET_PX,
                left: PLOT_INSET_PX,
              }"
            >
              <VisLine
                :x="xAccessor"
                :y="yAccessors"
                :color="lineColors"
                :curve-type="CurveType.MonotoneX"
                :line-width="1.5"
                highlight-on-hover
              />
              <VisAxis
                type="y"
                :tick-line="false"
                :domain-line="false"
                :grid-line="true"
                :num-ticks="maxRank"
                :tick-format="() => ''"
              />
              <ChartCrosshair :template="tooltipTemplate" :color="lineColors" />
              <ChartTooltip />
            </VisXYContainer>
          </ChartContainer>
        </div>

        <div class="flex justify-between px-1.5 text-[10px] text-muted-foreground sm:text-xs">
          <span v-for="date in axisDates" :key="date">{{ formatAxisDate(date) }}</span>
        </div>
      </div>

      <ul
        class="relative w-10 shrink-0 sm:w-11 md:w-36"
        :style="{ height: `${PLOT_HEIGHT_PX}px` }"
        aria-label="Latest standings"
      >
        <li
          v-for="team in rightLabels"
          :key="`end-${team.name}`"
          :class="[labelClass(team.name), 'left-0']"
          :style="{ top: labelTop(team.rank) }"
          @mouseenter="setHighlightedTeam(team.name)"
          @mouseleave="setHighlightedTeam(null)"
        >
          <span
            class="size-1.5 shrink-0 rounded-full"
            :style="{ backgroundColor: team.color }"
            aria-hidden="true"
          />
          <span class="truncate font-medium" :style="{ color: team.color }" :title="team.name">
            <span class="md:hidden">{{ shortTeamName(team.name) }}</span>
            <span class="hidden md:inline">{{ team.name }}</span>
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>
