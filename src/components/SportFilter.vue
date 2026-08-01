<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import {
  IconBallAmericanFootball,
  IconBallBaseball,
  IconBallBasketball,
  IconBallFootball,
  IconFlag,
  IconGolf,
} from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import IconHockey from '@/components/icons/IconHockey.vue'
import { Button } from '@/components/ui/button'
import type { Sport } from '@/types/sport'

const { t } = useI18n()

defineProps<{
  modelValue: Sport | 'all'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Sport | 'all']
}>()

const sports = computed<Array<{ id: Sport | 'all'; label: string; icon?: Component }>>(() => [
  { id: 'all', label: t('sports.all') },
  { id: 'football', label: t('sports.football'), icon: IconBallFootball },
  { id: 'basketball', label: t('sports.basketball'), icon: IconBallBasketball },
  { id: 'americanFootball', label: t('sports.americanFootball'), icon: IconBallAmericanFootball },
  { id: 'hockey', label: t('sports.hockey'), icon: IconHockey },
  { id: 'baseball', label: t('sports.baseball'), icon: IconBallBaseball },
  { id: 'golf', label: t('sports.golf'), icon: IconGolf },
  { id: 'politics', label: t('sports.politics'), icon: IconFlag },
])
</script>

<template>
  <div
    class="sticky top-14 z-40 mt-14 flex items-center justify-center gap-2 overflow-x-auto border-b bg-background/80 px-4 py-2 backdrop-blur-md"
  >
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
      <span :class="sport.icon ? 'hidden min-[860px]:inline' : undefined">{{ sport.label }}</span>
    </Button>
  </div>
</template>
