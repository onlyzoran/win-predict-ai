<script setup lang="ts">
import { formatPercent } from '@/lib/utils'

defineProps<{
  payload?: {
    name?: string
    winProbability?: number
  }
}>()
</script>

<template>
  <div
    class="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl"
  >
    <div class="font-medium">{{ payload?.name }}</div>
    <div class="font-mono font-medium tabular-nums text-foreground">
      {{ formatPercent(payload?.winProbability ?? 0) }}
    </div>
  </div>
</template>
