<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Component } from 'vue'
import { useStorage } from '@vueuse/core'
import {
  IconBallAmericanFootball,
  IconBallBaseball,
  IconBallBasketball,
  IconBallFootball,
  IconFlag,
  IconGolf,
} from '@tabler/icons-vue'
import IconHockey from '@/components/icons/IconHockey.vue'
import AppHeader from '@/components/AppHeader.vue'
import SportFilter from '@/components/SportFilter.vue'
import TeamProbabilityList from '@/components/TeamProbabilityList.vue'
import TeamProbabilityListSkeleton from '@/components/TeamProbabilityListSkeleton.vue'
import type { Sport } from '@/types/sport'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Progress } from '@/components/ui/progress'
import { locale } from '@/i18n'
import { formatDate, formatPercent, getTournamentProgress } from '@/lib/utils'

const DATA_BASE_URL = (
  import.meta.env.VITE_DATA_BASE_URL ?? `${import.meta.env.BASE_URL}data`
).replace(/\/$/, '')

const sportIcons: Record<Sport, Component> = {
  football: IconBallFootball,
  basketball: IconBallBasketball,
  americanFootball: IconBallAmericanFootball,
  hockey: IconHockey,
  baseball: IconBallBaseball,
  golf: IconGolf,
  politics: IconFlag,
}

interface LeagueEntry {
  team: string
  win_predict: number
}

interface LeagueManifest {
  id: string
  title: string
  sport: Sport
  file: string
  startDate: string
  endDate: string
  endDateTo?: string
}

interface TeamProbability {
  id: string
  name: string
  winProbability: number
}

interface League {
  id: string
  title: string
  teams: TeamProbability[]
  sport: Sport
  icon: Component
  progress: number
  startDate: string
  endDate: string
}

async function fetchJson<T>(file: string): Promise<T> {
  const res = await fetch(`${DATA_BASE_URL}/${file}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Failed to load ${file}: ${res.status}`)
  }
  return res.json() as Promise<T>
}

function toTeams(entries: LeagueEntry[]) {
  return entries.map((entry, index) => ({
    id: String(index + 1),
    name: entry.team,
    winProbability: entry.win_predict,
  }))
}

const leagues = ref<League[]>([])
const isLoading = ref(true)
const loadError = ref<string | null>(null)

onMounted(async () => {
  try {
    const configs = await fetchJson<LeagueManifest[]>('leagues.json')
    const loaded = await Promise.all(
      configs.map(async (config) => {
        const entries = await fetchJson<LeagueEntry[]>(config.file)
        return {
          id: config.id,
          title: config.title,
          teams: toTeams(entries),
          sport: config.sport,
          icon: sportIcons[config.sport],
          progress: getTournamentProgress(config.startDate, config.endDate, config.endDateTo),
          startDate: config.startDate,
          endDate: config.endDateTo || config.endDate,
        }
      }),
    )
    leagues.value = loaded
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Failed to load data'
  } finally {
    isLoading.value = false
  }
})

const selectedSport = ref<Sport | 'all'>('all')
const pinnedTournaments = useStorage<string[]>('pinnedTournaments', [])

const filteredLeagues = computed(() =>
  selectedSport.value === 'all'
    ? leagues.value
    : leagues.value.filter((league) => league.sport === selectedSport.value),
)

const sortedLeagues = computed(() => {
  const pinnedSet = new Set(pinnedTournaments.value)
  const pinned = []
  const unpinned = []

  for (const league of filteredLeagues.value) {
    if (pinnedSet.has(league.id)) {
      pinned.push(league)
    } else {
      unpinned.push(league)
    }
  }

  return [...pinned, ...unpinned]
})

interface SelectedLeague {
  title: string
  teams: TeamProbability[]
  progress: number
  startDate: string
  endDate: string
  icon?: Component
}

const isDetailsOpen = ref(false)
const selectedLeague = ref<SelectedLeague | null>(null)

function handleDetails(league: SelectedLeague) {
  selectedLeague.value = league
  isDetailsOpen.value = true
}

function handlePin(id: string, pinned: boolean) {
  if (pinned) {
    pinnedTournaments.value = pinnedTournaments.value.filter((tournamentId) => tournamentId !== id)
  } else {
    pinnedTournaments.value.push(id)
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-background">
    <AppHeader />
    <SportFilter v-model="selectedSport" />
    <main class="flex-1 flex flex-wrap items-start justify-start px-4 py-4 gap-4">
      <template v-if="isLoading">
        <span class="sr-only">{{ $t('data.loading') }}</span>
        <TeamProbabilityListSkeleton v-for="n in 10" :key="n" />
      </template>
      <p v-else-if="loadError" class="text-sm text-destructive">
        {{ $t('data.error') }}: {{ loadError }}
      </p>
      <template v-else>
        <TeamProbabilityList
          v-for="league in sortedLeagues"
          :key="league.id"
          :id="league.id"
          :title="league.title"
          :teams="league.teams"
          :progress="league.progress"
          :start-date="league.startDate"
          :end-date="league.endDate"
          :icon="league.icon"
          :pinned="pinnedTournaments.includes(league.id)"
          @pin="handlePin"
          @details="handleDetails"
        />
      </template>
    </main>

    <Sheet v-model:open="isDetailsOpen">
      <SheetContent>
        <SheetHeader>
          <SheetTitle class="flex items-center gap-2">
            <component :is="selectedLeague?.icon ?? IconBallFootball" class="size-4" />
            {{ selectedLeague?.title }}
          </SheetTitle>
          <Progress :model-value="selectedLeague?.progress ?? 0" class="mt-2 h-1" />
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>{{ formatDate(selectedLeague?.startDate ?? '', locale) }}</span>
            <span>{{ formatDate(selectedLeague?.endDate ?? '', locale) }}</span>
          </div>
        </SheetHeader>
        <div class="overflow-y-auto px-4">
          <div v-for="(team, index) in selectedLeague?.teams ?? []" :key="team.id">
            <div class="flex items-center justify-between py-2">
              <span class="font-medium">{{ team.name }}</span>
              <Badge variant="secondary">
                {{ formatPercent(team.winProbability) }}
              </Badge>
            </div>
            <Separator v-if="selectedLeague && index < selectedLeague.teams.length - 1" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
