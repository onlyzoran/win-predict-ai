<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import { IconArrowsSort, IconEyeOff, IconEyeOpen, IconPencil } from '@onlyzoran/win-predict-ai-icons'
import { useI18n } from 'vue-i18n'
import TournamentSearch from '@/components/TournamentSearch.vue'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@onlyzoran/win-predict-ai-ui'
import { useSports } from '@/composables/useSports'
import { getSportIcon } from '@/lib/sportIcons'
import type { SortMode } from '@/types/sort'
import type { Sport } from '@/types/sport'

const { t, te } = useI18n()
const { sports: catalog } = useSports()

defineProps<{
  modelValue: Sport | 'all'
  search: string
  sort: SortMode
  editMode: boolean
  hiddenItems: Array<{ id: string; title: string }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Sport | 'all']
  'update:search': [value: string]
  'update:sort': [value: SortMode]
  'update:editMode': [value: boolean]
  restore: [id: string]
}>()

function sportLabel(slug: string, apiLabel: string): string {
  const key = `sports.${slug}`
  return te(key) ? t(key) : apiLabel
}

const sports = computed<Array<{ id: Sport | 'all'; label: string; icon?: Component }>>(() => [
  { id: 'all', label: t('sports.all') },
  ...catalog.value.map((item) => ({
    id: item.slug,
    label: sportLabel(item.slug, item.label),
    icon: getSportIcon(item.iconKey),
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

function toggleEditMode(editMode: boolean) {
  emit('update:editMode', !editMode)
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
          <span :class="sport.icon ? 'hidden min-[1300px]:inline' : undefined">{{
            sport.label
          }}</span>
        </Button>
      </div>

      <div class="hidden shrink-0 items-center gap-2 md:flex">
        <Button
          variant="ghost"
          size="sm"
          class="shrink-0 cursor-pointer"
          :class="editMode ? 'bg-accent text-accent-foreground' : undefined"
          :aria-label="editMode ? t('editMode.exit') : t('editMode.enter')"
          :aria-pressed="editMode"
          @click="toggleEditMode(editMode)"
        >
          <IconPencil class="size-4" />
          <span class="hidden min-[1350px]:inline">{{ t('editMode.label') }}</span>
        </Button>

        <DropdownMenu v-if="hiddenItems.length > 0" :modal="false">
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="relative shrink-0 cursor-pointer"
              :aria-label="t('hidden.panel')"
            >
              <IconEyeOff class="size-4" />
              <Badge
                variant="secondary"
                class="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] leading-none"
              >
                {{ hiddenItems.length }}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-64">
            <DropdownMenuLabel>{{ t('hidden.panel') }}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              v-for="item in hiddenItems"
              :key="item.id"
              class="flex items-center justify-between gap-2"
              @select.prevent="emit('restore', item.id)"
            >
              <span class="truncate">{{ item.title }}</span>
              <IconEyeOpen class="size-4 shrink-0 text-muted-foreground" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
      <Button
        variant="ghost"
        size="sm"
        class="shrink-0 cursor-pointer"
        :class="editMode ? 'bg-accent text-accent-foreground' : undefined"
        :aria-label="editMode ? t('editMode.exit') : t('editMode.enter')"
        :aria-pressed="editMode"
        @click="toggleEditMode(editMode)"
      >
        <IconPencil class="size-4" />
      </Button>

      <DropdownMenu v-if="hiddenItems.length > 0" :modal="false">
        <DropdownMenuTrigger as-child>
          <Button
            variant="ghost"
            size="sm"
            class="relative shrink-0 cursor-pointer"
            :aria-label="t('hidden.panel')"
          >
            <IconEyeOff class="size-4" />
            <Badge
              variant="secondary"
              class="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] leading-none"
            >
              {{ hiddenItems.length }}
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="w-64">
          <DropdownMenuLabel>{{ t('hidden.panel') }}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            v-for="item in hiddenItems"
            :key="item.id"
            class="flex items-center justify-between gap-2"
            @select.prevent="emit('restore', item.id)"
          >
            <span class="truncate">{{ item.title }}</span>
            <IconEyeOpen class="size-4 shrink-0 text-muted-foreground" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
