<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import { IconArrowsSort } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import TournamentSearch from '@/components/TournamentSearch.vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { sportIcons } from '@/lib/sportIcons'
import type { SortMode } from '@/types/sort'
import type { Sport } from '@/types/sport'

const { t } = useI18n()

defineProps<{
  modelValue: Sport | 'all'
  search: string
  sort: SortMode
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Sport | 'all']
  'update:search': [value: string]
  'update:sort': [value: SortMode]
}>()

const sports = computed<Array<{ id: Sport | 'all'; label: string; icon?: Component }>>(() => [
  { id: 'all', label: t('sports.all') },
  ...(Object.keys(sportIcons) as Sport[]).map((id) => ({
    id,
    label: t(`sports.${id}`),
    icon: sportIcons[id],
  })),
])

const sortOptions = computed<Array<{ id: SortMode; label: string }>>(() => [
  { id: 'popular', label: t('sort.popular') },
  { id: 'name', label: t('sort.name') },
  { id: 'endingSoon', label: t('sort.endingSoon') },
])

function onSortChange(value: string | number | bigint | Record<string, unknown> | null) {
  if (value === 'popular' || value === 'name' || value === 'endingSoon') {
    emit('update:sort', value)
  }
}
</script>

<template>
  <div class="sticky top-14 z-40 mt-14 border-b bg-background/80 backdrop-blur-md">
    <div class="flex items-center gap-2 px-4 py-2">
      <div class="flex min-w-0 flex-1 items-center justify-start gap-2 overflow-x-auto">
        <Button
          v-for="sport in sports"
          :key="sport.id"
          :variant="modelValue === sport.id ? 'secondary' : 'ghost'"
          size="sm"
          class="shrink-0 cursor-pointer"
          :aria-label="sport.icon ? sport.label : undefined"
          @click="emit('update:modelValue', sport.id)"
        >
          <component :is="sport.icon" v-if="sport.icon" class="size-4" />
          <span :class="sport.icon ? 'hidden min-[1250px]:inline' : undefined">{{
            sport.label
          }}</span>
        </Button>
      </div>

      <div class="hidden shrink-0 items-center gap-2 md:flex">
        <DropdownMenu :modal="false">
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="shrink-0 cursor-pointer"
              :aria-label="t('sort.label')"
            >
              <IconArrowsSort class="size-4" />
              <span class="hidden min-[1350px]:inline">{{ t(`sort.${sort}`) }}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup :model-value="sort" @update:model-value="onSortChange">
              <DropdownMenuRadioItem
                v-for="option in sortOptions"
                :key="option.id"
                :value="option.id"
              >
                {{ option.label }}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <TournamentSearch
          class="w-48 shrink-0 md:w-56"
          :model-value="search"
          @update:model-value="emit('update:search', $event)"
        />
      </div>
    </div>

    <div class="flex items-center gap-2 border-t px-4 py-2 md:hidden">
      <DropdownMenu :modal="false">
        <DropdownMenuTrigger as-child>
          <Button
            variant="ghost"
            size="sm"
            class="shrink-0 cursor-pointer"
            :aria-label="t('sort.label')"
          >
            <IconArrowsSort class="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup :model-value="sort" @update:model-value="onSortChange">
            <DropdownMenuRadioItem
              v-for="option in sortOptions"
              :key="option.id"
              :value="option.id"
            >
              {{ option.label }}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <TournamentSearch
        class="min-w-0 flex-1"
        :model-value="search"
        @update:model-value="emit('update:search', $event)"
      />
    </div>
  </div>
</template>
