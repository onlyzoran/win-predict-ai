<script setup lang="ts">
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Separator,
  Skeleton,
} from '@onlyzoran/win-predict-ai-ui'

const ROW_COUNT = 6
</script>

<template>
  <Card class="w-full sm:max-w-xs sm:min-w-3xs p-0" aria-hidden="true">
    <CardHeader class="px-4 pt-4">
      <div class="flex min-h-8 items-center justify-between">
        <div class="flex items-center gap-2">
          <Skeleton class="size-4 rounded-sm" />
          <Skeleton class="h-5 w-32" />
        </div>
        <Skeleton class="size-8 rounded-md" />
      </div>
      <Skeleton class="mt-4 h-1 w-full" />
    </CardHeader>
    <CardContent class="p-0">
      <template v-for="index in ROW_COUNT" :key="index">
        <div class="flex h-10 items-center justify-between px-4">
          <Skeleton class="h-4 w-28" />
          <Skeleton class="h-5 w-12 rounded-full" />
        </div>
        <Separator v-if="index < ROW_COUNT" />
      </template>
    </CardContent>
    <CardFooter class="px-4 pb-4">
      <Skeleton class="h-9 w-full" />
    </CardFooter>
  </Card>
</template>
