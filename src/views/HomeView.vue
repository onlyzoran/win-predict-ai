<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useIntersectionObserver, useStorage } from '@vueuse/core'
import SportFilter from '@/components/SportFilter.vue'
import HomeCategorySliderLayout from '@/components/HomeCategorySliderLayout.vue'
import TeamProbabilityList from '@/components/TeamProbabilityList.vue'
import TeamProbabilityListSkeleton from '@/components/TeamProbabilityListSkeleton.vue'
import TournamentDetails from '@/components/TournamentDetails.vue'
import { useLeaguePreview } from '@/composables/useLeaguePreview'
import { useLeagues } from '@/composables/useLeagues'
import { useHiddenTournaments } from '@/composables/useHiddenTournaments'
import { usePinnedTournaments } from '@/composables/usePinnedTournaments'
import { useSports } from '@/composables/useSports'
import type { SortMode } from '@/types/sort'
import type { Sport } from '@/types/sport'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { locale } from '@/i18n'
import { homeScreenLayoutShowsFilters, resolveHomeScreenLayout } from '@/lib/homeScreenLayout'
import {
  excludeHiddenSlots,
  filterSlots,
  slotIdsForLoading,
  sortSlotsWithPinned,
} from '@/lib/tournaments'

const homeScreenLayout = resolveHomeScreenLayout()
const showsFilters = homeScreenLayoutShowsFilters(homeScreenLayout)
const isCategorySliderLayout = homeScreenLayout === 'category-slider'

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
const { sports: sportsCatalog } = useSports()
const { pinnedTournaments, handlePin } = usePinnedTournaments()
const { hiddenTournaments, handleHide, handleRestore } = useHiddenTournaments()
const { isPreviewOpen, previewLeague, isPreviewLoading, openPreview } = useLeaguePreview()

const selectedSport = ref<Sport | 'all'>('all')
const searchQuery = ref('')
const sortMode = useStorage<SortMode>('tournamentSort', 'popular')
const editMode = ref(false)
const visibleCount = ref(initialBatchSize)
const loadMoreTrigger = ref<HTMLElement | null>(null)

const sportFilteredSlots = computed(() =>
  filterSlots(slots.value, selectedSport.value, searchQuery.value),
)

const displaySlots = computed(() => {
  const source = showsFilters ? sportFilteredSlots.value : slots.value
  return excludeHiddenSlots(source, hiddenTournaments.value)
})

const sortedSlots = computed(() =>
  sortSlotsWithPinned(displaySlots.value, pinnedTournaments.value, sortMode.value, locale.value),
)

const sliderSlots = computed(() => (isCategorySliderLayout ? sortedSlots.value : []))

const hiddenItems = computed(() =>
  hiddenTournaments.value
    .map((id) => {
      const slot = slots.value.find((entry) => entry.id === id)
      if (!slot) {
        return null
      }

      return {
        id,
        title: slot.league?.title ?? slot.sortTitle ?? id,
      }
    })
    .filter((item): item is { id: string; title: string } => item !== null),
)

const visibleSlots = computed(() =>
  isCategorySliderLayout ? [] : sortedSlots.value.slice(0, visibleCount.value),
)
const hasPendingSlots = computed(() => {
  const pending = isCategorySliderLayout ? sliderSlots.value : visibleSlots.value
  return pending.some((slot) => !slot.league)
})
const hasMore = computed(
  () => !isCategorySliderLayout && sortedSlots.value.length > visibleCount.value,
)
const isHomeEmpty = computed(() =>
  isCategorySliderLayout ? sliderSlots.value.length === 0 : visibleSlots.value.length === 0,
)

watch(
  () => (isCategorySliderLayout ? sliderSlots.value : visibleSlots.value).map((slot) => slot.id),
  async (ids) => {
    if (isManifestLoading.value || loadError.value || ids.length === 0) {
      return
    }

    await loadNextBatch(ids)
  },
  { immediate: true },
)

watch([selectedSport, sortMode], () => {
  if (!isCategorySliderLayout) {
    visibleCount.value = initialBatchSize
  }
})

watch(searchQuery, async (query) => {
  if (isCategorySliderLayout) {
    return
  }

  visibleCount.value = initialBatchSize

  if (!query.trim() || isManifestLoading.value || loadError.value) {
    return
  }

  await loadNextBatch(slotIdsForLoading(slots.value, hiddenTournaments.value))
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
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <SportFilter
      v-if="showsFilters"
      v-model="selectedSport"
      v-model:search="searchQuery"
      v-model:sort="sortMode"
      v-model:edit-mode="editMode"
      :hidden-items="hiddenItems"
      @restore="handleRestore"
    />
    <div
      :class="
        isCategorySliderLayout
          ? 'flex min-h-0 flex-1 flex-col overflow-y-auto'
          : 'flex flex-1 flex-wrap items-start justify-start gap-4 px-4 py-4'
      "
    >
      <template v-if="isManifestLoading">
        <span class="sr-only">{{ $t('data.loading') }}</span>
        <div
          v-if="isCategorySliderLayout"
          class="flex gap-4 overflow-x-auto px-4 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div v-for="n in 3" :key="n" class="w-72 shrink-0">
            <TeamProbabilityListSkeleton />
          </div>
        </div>
        <TeamProbabilityListSkeleton v-else v-for="n in 6" :key="n" />
      </template>
      <p v-else-if="loadError" class="px-4 text-sm text-destructive">
        {{ $t('data.error') }}: {{ loadError }}
      </p>
      <template v-else>
        <span v-if="hasPendingSlots" class="sr-only">{{ $t('data.loading') }}</span>
        <div
          v-if="failedCount > 0"
          :class="
            isCategorySliderLayout
              ? 'mx-4 mt-4 flex w-auto flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive'
              : 'flex w-full flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive'
          "
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
          v-if="isHomeEmpty"
          :class="
            isCategorySliderLayout
              ? 'px-4 py-8 text-center text-sm text-muted-foreground'
              : 'w-full py-8 text-center text-sm text-muted-foreground'
          "
        >
          {{ $t('search.empty') }}
        </p>
        <HomeCategorySliderLayout
          v-else-if="isCategorySliderLayout"
          :slots="sliderSlots"
          :sports-catalog="sportsCatalog"
          :pinned-ids="pinnedTournaments"
          :sort-mode="sortMode"
          :edit-mode="editMode"
          @pin="handlePin"
          @hide="handleHide"
          @preview="openPreview"
        />
        <template v-else>
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
              :edit-mode="editMode"
              @pin="handlePin"
              @hide="handleHide"
              @preview="openPreview"
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
      </template>
    </div>

    <Sheet v-model:open="isPreviewOpen">
      <SheetContent>
        <SheetHeader class="sr-only">
          <SheetTitle>
            {{ previewLeague?.fullTitle || previewLeague?.title }}
          </SheetTitle>
        </SheetHeader>
        <div v-if="previewLeague" class="overflow-y-auto p-4">
          <p v-if="isPreviewLoading" class="text-sm text-muted-foreground">
            {{ $t('data.loading') }}
          </p>
          <TournamentDetails
            v-else
            :title="previewLeague.title"
            :full-title="previewLeague.fullTitle"
            :teams="previewLeague.teams"
            :progress="previewLeague.progress"
            :start-date="previewLeague.startDate"
            :end-date="previewLeague.endDate"
            :icon="previewLeague.icon"
            compact
          />
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
