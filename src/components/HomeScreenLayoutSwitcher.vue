<script setup lang="ts">
import { IconLayoutGrid, IconLayoutRows } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { HOME_SCREEN_LAYOUTS, type HomeScreenLayout } from '@/lib/homeScreenLayout'

const model = defineModel<HomeScreenLayout>({ required: true })

const { t } = useI18n()

const layoutIcons = {
  grid: IconLayoutGrid,
  'category-slider': IconLayoutRows,
} as const
</script>

<template>
  <div
    role="group"
    :aria-label="t('home.layout.label')"
    class="flex items-center gap-1"
  >
    <Button
      v-for="layout in HOME_SCREEN_LAYOUTS"
      :key="layout"
      :variant="model === layout ? 'secondary' : 'ghost'"
      size="sm"
      class="shrink-0 cursor-pointer"
      :aria-pressed="model === layout"
      @click="model = layout"
    >
      <component :is="layoutIcons[layout]" class="size-4" aria-hidden="true" />
      <span class="hidden min-[900px]:inline">{{ t(`home.layout.${layout}`) }}</span>
    </Button>
  </div>
</template>
