<script setup lang="ts">
import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import { useColorPalette } from '@/composables/useColorPalette'

useColorPalette()
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background">
    <AppHeader />
    <main class="flex-1">
      <RouterView />
    </main>
    <AppFooter />
  </div>
</template>
