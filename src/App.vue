<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background">
    <AppHeader />
    <RouterView />
  </div>
</template>
