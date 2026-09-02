<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CategorySliderLayout } from '@onlyzoran/win-predict-ai-ui'
import HomeCategorySliderItem from '@/components/HomeCategorySliderItem.vue'
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

function asLeagueSlot(item: unknown): LeagueSlot {
  return item as LeagueSlot
}
</script>

<template>
  <CategorySliderLayout
    :categories="categories"
    class="min-h-0 w-full"
    :aria-label="t('home.categorySliders')"
  >
    <template #category-header="{ category, headingId }">
      <h2
        :id="headingId"
        class="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground"
      >
        <component
          :is="iconForCategory(category.id)"
          v-if="iconForCategory(category.id)"
          class="size-4"
          aria-hidden="true"
        />
        {{ category.title }}
      </h2>
    </template>

    <template #item="{ item }">
      <HomeCategorySliderItem
        :slot-item="asLeagueSlot(item)"
        :pinned-ids="pinnedIds"
        :edit-mode="editMode"
        @pin="(id, pinned) => emit('pin', id, pinned)"
        @hide="(id) => emit('hide', id)"
        @preview="(league) => emit('preview', league)"
      />
    </template>
  </CategorySliderLayout>
</template>
