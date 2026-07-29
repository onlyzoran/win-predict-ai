<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconBallFootball } from '@tabler/icons-vue'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { formatPercent } from '@/lib/utils'

const { t } = useI18n()

interface TeamProbability {
  id: string
  name: string
  winProbability: number // 0–100
}

const TOP_TEAMS_COUNT = 5

const props = defineProps<{
  title: string
  teams: TeamProbability[]
}>()

const emit = defineEmits<{
  details: [league: { title: string, teams: TeamProbability[] }]
}>()

function handleDetailsClick() {
  emit('details', { title: props.title, teams: props.teams })
}

const visibleTeams = computed<TeamProbability[]>(() => {
  const topTeams = props.teams.slice(0, TOP_TEAMS_COUNT)
  const restTeams = props.teams.slice(TOP_TEAMS_COUNT)

  if (restTeams.length === 0) {
    return topTeams
  }

  const restProbability = restTeams.reduce(
    (sum, restTeam) => sum + restTeam.winProbability,
    0,
  )

  return [
    ...topTeams,
    {
      id: 'rest',
      name: t('team.others', { count: restTeams.length }),
      winProbability: restProbability,
    },
  ]
})
</script>

<template>
  <Card class="w-full max-w-2xs min-w-3xs p-0">
    <CardHeader class="px-4 pt-4">
      <CardTitle class="flex items-center gap-2">
        <IconBallFootball class="size-4" />
        {{ title }}
      </CardTitle>
      <Progress :model-value="50" class="mt-4 h-1" />
    </CardHeader>
    <CardContent class="p-0">
      <div
        v-for="(team, index) in visibleTeams"
        :key="team.id"
      >
        <div class="flex items-center justify-between px-4 py-2">
          <span class="font-medium">{{ team.name }}</span>
          <Badge variant="secondary">
            {{ formatPercent(team.winProbability) }}
          </Badge>
        </div>
        <Separator v-if="index < visibleTeams.length - 1" />
      </div>
    </CardContent>
    <CardFooter class="px-4 pb-4">
      <Button variant="outline" class="w-full cursor-pointer" @click="handleDetailsClick">
        {{ t('team.details') }}
      </Button>
    </CardFooter>
  </Card>
</template>
