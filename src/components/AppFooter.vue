<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const version = __APP_VERSION__
const stack = [
  'Vue',
  'Vite',
  'TypeScript',
  'Tailwind',
  'Pinia',
  'i18n',
  'Reka UI',
  'Unovis',
] as const

const stackRows = [stack.slice(0, 4), stack.slice(4)] as const
</script>

<template>
  <footer class="mt-auto border-t border-border/60 py-4">
    <div class="container mx-auto px-4 text-xs text-muted-foreground">
      <!-- Mobile: two balanced rows -->
      <div class="flex flex-col gap-0.5 sm:hidden">
        <ul
          v-for="(row, rowIndex) in stackRows"
          :key="rowIndex"
          class="flex flex-wrap items-center gap-x-1.5"
        >
          <li v-for="(item, index) in row" :key="item" class="inline-flex items-center">
            <span>{{ item }}</span>
            <span v-if="index < row.length - 1" aria-hidden="true" class="ml-1.5 text-border">·</span>
          </li>
          <li v-if="rowIndex === 0" class="ml-auto tabular-nums">
            {{ t('app.version', { version }) }}
          </li>
        </ul>
      </div>

      <!-- sm+: single row -->
      <ul class="hidden flex-wrap items-center gap-x-1.5 gap-y-0.5 sm:flex">
        <li v-for="(item, index) in stack" :key="item" class="inline-flex items-center">
          <span>{{ item }}</span>
          <span v-if="index < stack.length - 1" aria-hidden="true" class="ml-1.5 text-border">·</span>
        </li>
        <li class="ml-auto tabular-nums">{{ t('app.version', { version }) }}</li>
      </ul>
    </div>
  </footer>
</template>
