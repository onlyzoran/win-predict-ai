<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { IconSearch, IconX } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import { cn } from '@/lib/utils'

const { t } = useI18n()

const props = defineProps<{
  modelValue: string
  class?: HTMLAttributes['class']
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div :class="cn('relative w-full', props.class)">
    <IconSearch
      class="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
    />
    <input
      type="search"
      :value="modelValue"
      :placeholder="t('search.placeholder')"
      :aria-label="t('search.placeholder')"
      class="h-8 w-full rounded-md border border-input bg-transparent py-1 pr-7 pl-7 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:hidden"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <button
      v-if="modelValue"
      type="button"
      class="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
      :aria-label="t('search.clear')"
      @click="emit('update:modelValue', '')"
    >
      <IconX class="size-3.5" />
    </button>
  </div>
</template>
