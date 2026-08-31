<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CategorySliderLayout } from '@onlyzoran/win-predict-ai-ui'
import TeamProbabilityList from '@/components/TeamProbabilityList.vue'
import TeamProbabilityListSkeleton from '@/components/TeamProbabilityListSkeleton.vue'
import { buildCategorySliderCategories } from '@/lib/categorySliderCategories'
import { getSportIcon } from '@/lib/sportIcons'
import type { LeagueSlot, SelectedLeague } from '@/types/league'
import type { SortMode } from '@/types/sort'
import type { SportCatalogItem } from '@/types/sport'

const props = defineProps<{
  slots: LeagueSlot[]
  sportsCatalog: SportCatalogItem[]
  pinnedIds: string[]
  sortMode: SortMode
  editMode: boolean
}>()

const emit = defineEmits<{
  pin: [id: string, pinned: boolean]
  hide: [id: string]
  preview: [league: SelectedLeague]
}>()

const { locale, t, te } = useI18n()

function sportLabel(slug: string, apiLabel: string): string {
  const key = `sports.${slug}`
  return te(key) ? t(key) : apiLabel
}

const categories = computed(() =>
  buildCategorySliderCategories(
    props.slots,
    props.sportsCatalog,
    props.pinnedIds,
    props.sortMode,
    locale.value,
    sportLabel,
  ),
)

function iconForCategory(categoryId: string): Component | undefined {
  const catalogItem = props.sportsCatalog.find((item) => item.slug === categoryId)
  return getSportIcon(catalogItem?.iconKey ?? categoryId)
}
</script>

<template>
  <CategorySliderLayout
    :categories="categories"
    class="flex-1"
    :aria-label="$t('home.categorySliders')"
  >
    <template #category-header="{ category }">
      <h2 class="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
        <component
          :is="iconForCategory(category.id)"
          v-if="iconForCategory(category.id)"
          class="size-4"
          aria-hidden="true"
        />
        {{ category.title }}
      </h2>
    </template>

    <template #item="{ item: slot }">
      <div class="w-72 min-w-72">
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
          :pinned="props.pinnedIds.includes(slot.league.id)"
          :edit-mode="editMode"
          @pin="(id, pinned) => emit('pin', id, pinned)"
          @hide="(id) => emit('hide', id)"
          @preview="(league) => emit('preview', league)"
        />
        <TeamProbabilityListSkeleton v-else />
      </div>
    </template>
  </CategorySliderLayout>
</template>
