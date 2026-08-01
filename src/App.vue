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
import type { SortMode } from '@/types/sort'
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
  popularPriority: number
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
  popularPriority: number
}

interface LeagueSlot {
  id: string
  sport: Sport
  popularPriority: number
  league: League | null
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

function toLeague(config: LeagueManifest, entries: LeagueEntry[]): League {
  return {
    id: config.id,
    title: config.title,
    teams: toTeams(entries),
    sport: config.sport,
    icon: sportIcons[config.sport],
    progress: getTournamentProgress(config.startDate, config.endDate, config.endDateTo),
    startDate: config.startDate,
    endDate: config.endDateTo || config.endDate,
    popularPriority: config.popularPriority,
  }
}

const slots = ref<LeagueSlot[]>([])
const isManifestLoading = ref(true)
const loadError = ref<string | null>(null)

onMounted(async () => {
  try {
    const configs = await fetchJson<LeagueManifest[]>('leagues.json')
    slots.value = configs.map((config) => ({
      id: config.id,
      sport: config.sport,
      popularPriority: config.popularPriority,
      league: null,
    }))
    isManifestLoading.value = false

    for (const config of configs) {
      try {
        const entries = await fetchJson<LeagueEntry[]>(config.file)
        slots.value = slots.value.map((slot) =>
          slot.id === config.id ? { ...slot, league: toLeague(config, entries) } : slot,
        )
      } catch {
        slots.value = slots.value.filter((slot) => slot.id !== config.id)
      }
    }
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Failed to load data'
    isManifestLoading.value = false
  }
})

const selectedSport = ref<Sport | 'all'>('all')
const searchQuery = ref('')
const sortMode = useStorage<SortMode>('tournamentSort', 'popular')
const pinnedTournaments = useStorage<string[]>('pinnedTournaments', [])

const filteredSlots = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return slots.value.filter((slot) => {
    if (selectedSport.value !== 'all' && slot.sport !== selectedSport.value) {
      return false
    }

    if (!query) {
      return true
    }

    if (!slot.league) {
      return false
    }

    if (slot.league.title.toLowerCase().includes(query)) {
      return true
    }

    return slot.league.teams.some((team) => team.name.toLowerCase().includes(query))
  })
})

function compareSlots(a: LeagueSlot, b: LeagueSlot) {
  if (sortMode.value === 'name') {
    if (!a.league && !b.league) return 0
    if (!a.league) return 1
    if (!b.league) return -1
    return a.league.title.localeCompare(b.league.title, locale.value)
  }

  if (sortMode.value === 'endingSoon') {
    if (!a.league && !b.league) return 0
    if (!a.league) return 1
    if (!b.league) return -1
    return a.league.endDate.localeCompare(b.league.endDate)
  }

  return a.popularPriority - b.popularPriority
}

const sortedSlots = computed(() => {
  const pinnedSet = new Set(pinnedTournaments.value)
  const pinned: LeagueSlot[] = []
  const unpinned: LeagueSlot[] = []

  for (const slot of filteredSlots.value) {
    if (pinnedSet.has(slot.id)) {
      pinned.push(slot)
    } else {
      unpinned.push(slot)
    }
  }

  pinned.sort(compareSlots)
  unpinned.sort(compareSlots)

  return [...pinned, ...unpinned]
})

const hasPendingSlots = computed(() => sortedSlots.value.some((slot) => !slot.league))

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
    <SportFilter
      v-model="selectedSport"
      v-model:search="searchQuery"
      v-model:sort="sortMode"
    />
    <main class="flex-1 flex flex-wrap items-start justify-start px-4 py-4 gap-4">
      <template v-if="isManifestLoading">
        <span class="sr-only">{{ $t('data.loading') }}</span>
        <TeamProbabilityListSkeleton v-for="n in 6" :key="n" />
      </template>
      <p v-else-if="loadError" class="text-sm text-destructive">
        {{ $t('data.error') }}: {{ loadError }}
      </p>
      <template v-else>
        <span v-if="hasPendingSlots" class="sr-only">{{ $t('data.loading') }}</span>
        <p
          v-if="sortedSlots.length === 0"
          class="w-full py-8 text-center text-sm text-muted-foreground"
        >
          {{ $t('search.empty') }}
        </p>
        <template v-for="slot in sortedSlots" :key="slot.id">
          <TeamProbabilityList
            v-if="slot.league"
            :id="slot.league.id"
            :title="slot.league.title"
            :teams="slot.league.teams"
            :progress="slot.league.progress"
            :start-date="slot.league.startDate"
            :end-date="slot.league.endDate"
            :icon="slot.league.icon"
            :pinned="pinnedTournaments.includes(slot.league.id)"
            @pin="handlePin"
            @details="handleDetails"
          />
          <TeamProbabilityListSkeleton v-else />
        </template>
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
