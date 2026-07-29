<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number | string
    stroke?: number | string
  }>(),
  { size: 24, stroke: 2 },
)
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="tabler-icon tabler-icon-hockey"
  >
    <path d="M4 8a8 3 0 1 0 16 0a8 3 0 1 0 -16 0" />
    <path d="M4 8v5c0 1.657 3.582 3 8 3s8 -1.343 8 -3v-5" />
  </svg>
</template>
