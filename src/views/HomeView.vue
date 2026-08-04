<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useIntersectionObserver, useStorage } from '@vueuse/core'
import SportFilter from '@/components/SportFilter.vue'
import TeamProbabilityList from '@/components/TeamProbabilityList.vue'
import TeamProbabilityListSkeleton from '@/components/TeamProbabilityListSkeleton.vue'
import TournamentDetails from '@/components/TournamentDetails.vue'
import { useLeagues } from '@/composables/useLeagues'
import { usePinnedTournaments } from '@/composables/usePinnedTournaments'
import type { SelectedLeague } from '@/types/league'
import type { SortMode } from '@/types/sort'
import type { Sport } from '@/types/sport'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { locale } from '@/i18n'
import { filterSlots, sortSlotsWithPinned } from '@/lib/tournaments'

const {
  slots,
  isManifestLoading,
  loadError,
  initialBatchSize,
  isLoadingMore,
  failedCount,
  isRetrying,
  loadNextBatch,
  retryFailed,
} = useLeagues()
const { pinnedTournaments, handlePin } = usePinnedTournaments()

const selectedSport = ref<Sport | 'all'>('all')
const searchQuery = ref('')
const sortMode = useStorage<SortMode>('tournamentSort', 'popular')
const visibleCount = ref(initialBatchSize)
const loadMoreTrigger = ref<HTMLElement | null>(null)

const filteredSlots = computed(() =>
  filterSlots(slots.value, selectedSport.value, searchQuery.value),
)

const sortedSlots = computed(() =>
  sortSlotsWithPinned(filteredSlots.value, pinnedTournaments.value, sortMode.value, locale.value),
)

const visibleSlots = computed(() => sortedSlots.value.slice(0, visibleCount.value))
const hasPendingSlots = computed(() => visibleSlots.value.some((slot) => !slot.league))
const hasMore = computed(() => sortedSlots.value.length > visibleCount.value)

const isPreviewOpen = ref(false)
const selectedLeague = ref<SelectedLeague | null>(null)

watch(
  () => visibleSlots.value.map((slot) => slot.id),
  async (ids) => {
    if (isManifestLoading.value || loadError.value || ids.length === 0) {
      return
    }

    await loadNextBatch(ids)
  },
  { immediate: true },
)

watch([selectedSport, sortMode], () => {
  visibleCount.value = initialBatchSize
})

watch(searchQuery, async (query) => {
  visibleCount.value = initialBatchSize

  if (!query.trim() || isManifestLoading.value || loadError.value) {
    return
  }

  await loadNextBatch(slots.value.map((slot) => slot.id))
})

useIntersectionObserver(
  loadMoreTrigger,
  ([entry]) => {
    if (
      entry?.isIntersecting &&
      hasMore.value &&
      !isManifestLoading.value &&
      !loadError.value &&
      !isLoadingMore.value
    ) {
      visibleCount.value += initialBatchSize
    }
  },
  {
    rootMargin: '200px 0px',
  },
)

function handlePreview(league: SelectedLeague) {
  selectedLeague.value = league
  isPreviewOpen.value = true
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <SportFilter v-model="selectedSport" v-model:search="searchQuery" v-model:sort="sortMode" />
    <main class="flex flex-1 flex-wrap items-start justify-start gap-4 px-4 py-4">
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
          class="flex w-full flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
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
          v-if="visibleSlots.length === 0"
          class="w-full py-8 text-center text-sm text-muted-foreground"
        >
          {{ $t('search.empty') }}
        </p>
        <template v-for="slot in visibleSlots" :key="slot.id">
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
            @preview="handlePreview"
          />
          <TeamProbabilityListSkeleton v-else />
        </template>
        <div
          v-if="hasMore"
          ref="loadMoreTrigger"
          class="h-px w-full"
          aria-hidden="true"
        />
      </template>
    </main>

    <Sheet v-model:open="isPreviewOpen">
      <SheetContent>
        <SheetHeader class="sr-only">
          <SheetTitle>
            {{ selectedLeague?.fullTitle || selectedLeague?.title }}
          </SheetTitle>
        </SheetHeader>
        <div v-if="selectedLeague" class="overflow-y-auto p-4">
          <TournamentDetails
            :title="selectedLeague.title"
            :full-title="selectedLeague.fullTitle"
            :teams="selectedLeague.teams"
            :progress="selectedLeague.progress"
            :start-date="selectedLeague.startDate"
            :end-date="selectedLeague.endDate"
            :icon="selectedLeague.icon"
            compact
          />
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
