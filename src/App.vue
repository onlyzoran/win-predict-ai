<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { IconBallFootball } from '@tabler/icons-vue'
import AppHeader from '@/components/AppHeader.vue'
import SportFilter from '@/components/SportFilter.vue'
import TeamProbabilityList from '@/components/TeamProbabilityList.vue'
import TeamProbabilityListSkeleton from '@/components/TeamProbabilityListSkeleton.vue'
import { useLeagues } from '@/composables/useLeagues'
import { usePinnedTournaments } from '@/composables/usePinnedTournaments'
import type { SelectedLeague } from '@/types/league'
import type { SortMode } from '@/types/sort'
import type { Sport } from '@/types/sport'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Progress } from '@/components/ui/progress'
import { locale } from '@/i18n'
import { filterSlots, sortSlotsWithPinned } from '@/lib/tournaments'
import { formatDate, formatPercent, formatSeason } from '@/lib/utils'

const { slots, isManifestLoading, loadError, failedCount, isRetrying, retryFailed } = useLeagues()
const { pinnedTournaments, handlePin } = usePinnedTournaments()

const selectedSport = ref<Sport | 'all'>('all')
const searchQuery = ref('')
const sortMode = useStorage<SortMode>('tournamentSort', 'popular')

const filteredSlots = computed(() =>
  filterSlots(slots.value, selectedSport.value, searchQuery.value),
)

const sortedSlots = computed(() =>
  sortSlotsWithPinned(filteredSlots.value, pinnedTournaments.value, sortMode.value, locale.value),
)

const hasPendingSlots = computed(() => sortedSlots.value.some((slot) => !slot.league))

const isDetailsOpen = ref(false)
const selectedLeague = ref<SelectedLeague | null>(null)

function handleDetails(league: SelectedLeague) {
  selectedLeague.value = league
  isDetailsOpen.value = true
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
        <div
          v-if="failedCount > 0"
          class="w-full flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          <p>{{ $t('data.partialError', { count: failedCount }) }}</p>
          <Button
            variant="outline"
            size="sm"
            class="border-destructive/40 text-destructive hover:bg-destructive/10"
            :disabled="isRetrying"
            @click="retryFailed"
          >
            {{ $t('data.retry') }}
          </Button>
        </div>
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
            :full-title="slot.league.fullTitle"
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
            {{ selectedLeague?.fullTitle || selectedLeague?.title }}
          </SheetTitle>
          <SheetDescription v-if="selectedLeague">
            {{ $t('team.season') }}
            {{ formatSeason(selectedLeague.startDate, selectedLeague.endDate) }}
          </SheetDescription>
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
