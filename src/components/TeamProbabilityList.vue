<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { IconBallFootball, IconPin, IconPinnedOff } from '@onlyzoran/win-predict-ai-icons'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@onlyzoran/win-predict-ai-ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import type { TeamProbability } from '@/types/league'
import { aggregateTopTeams, TOP_TEAMS_COUNT } from '@/lib/teamProbability'
import { formatPercent, formatSeason } from '@/lib/utils'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    id: string
    title: string
    fullTitle?: string
    teams: TeamProbability[]
    progress?: number
    startDate?: string
    endDate?: string
    icon?: Component
    pinned: boolean
  }>(),
  {
    fullTitle: undefined,
    progress: 0,
    startDate: '',
    endDate: '',
    icon: () => IconBallFootball,
    pinned: false,
  },
)

const emit = defineEmits<{
  pin: [id: string, pinned: boolean]
  preview: [
    league: {
      id: string
      title: string
      fullTitle?: string
      teams: TeamProbability[]
      progress: number
      startDate: string
      endDate: string
      icon: Component
      pinned: boolean
    },
  ]
}>()

const season = computed(() => formatSeason(props.startDate, props.endDate, { short: true }))

const displayTitle = computed(() => {
  if (!season.value) {
    return props.title
  }

  const baseTitle = props.title.replace(/\s+(?:\d{4}|\d{2})(?:\/(?:\d{4}|\d{2}))?$/, '')
  return `${baseTitle} ${season.value}`
})

function handlePreviewClick() {
  emit('preview', {
    id: props.id,
    title: props.title,
    fullTitle: props.fullTitle,
    teams: props.teams,
    progress: props.progress,
    startDate: props.startDate,
    endDate: props.endDate,
    icon: props.icon,
    pinned: props.pinned,
  })
}

function handlePinClick() {
  emit('pin', props.id, props.pinned)
}

const visibleTeams = computed<TeamProbability[]>(() => {
  const othersRow = props.teams.find((team) => team.id === 'others')
  if (othersRow) {
    const topTeams = props.teams.filter((team) => team.id !== 'others')
    const othersCount = othersRow.othersCount ?? 0
    return [
      ...topTeams,
      {
        ...othersRow,
        name: t('team.others', { count: othersCount }),
      },
    ]
  }

  const restCount = Math.max(0, props.teams.length - TOP_TEAMS_COUNT)

  return aggregateTopTeams(props.teams, {
    topN: TOP_TEAMS_COUNT,
    othersLabel: t('team.others', { count: restCount }),
  })
})
</script>

<template>
  <Card class="w-full p-0 sm:max-w-xs sm:min-w-3xs">
    <CardHeader class="px-4 pt-4">
      <div class="flex justify-between">
        <CardTitle class="flex items-center gap-2">
          <component :is="icon" class="size-4" />
          {{ displayTitle }}
        </CardTitle>
        <button
          class="rounded-md px-2 py-1 text-sm font-medium uppercase text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          :aria-label="pinned ? t('pin.remove') : t('pin.add')"
          @click="handlePinClick"
        >
          <IconPin v-if="!pinned" />
          <IconPinnedOff v-else />
        </button>
      </div>
      <Progress :model-value="progress" class="mt-4 h-1" />
    </CardHeader>
    <CardContent class="p-0">
      <div v-for="(team, index) in visibleTeams" :key="team.id">
        <div class="flex items-center justify-between px-4 py-2">
          <span class="font-medium">{{ team.name }}</span>
          <Badge variant="secondary">
            {{ formatPercent(team.winProbability) }}
          </Badge>
        </div>
        <Separator v-if="index < visibleTeams.length - 1" />
      </div>
    </CardContent>
    <CardFooter class="flex gap-2 px-4 pb-4">
      <Button variant="outline" class="flex-1 cursor-pointer" @click="handlePreviewClick">
        {{ t('team.preview') }}
      </Button>
      <Button as-child class="flex-1 cursor-pointer">
        <RouterLink :to="{ name: 'tournament', params: { id } }">
          {{ t('team.details') }}
        </RouterLink>
      </Button>
    </CardFooter>
  </Card>
</template>
