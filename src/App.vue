<script setup lang="ts">
import { CookieConsentBanner } from '@onlyzoran/win-predict-ai-ui'
import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import { loadAnalyticsIfConsented } from '@/composables/loadAnalyticsIfConsented'
import { useAppConsent } from '@/composables/useAppConsent'
import { useColorPalette } from '@/composables/useColorPalette'

const { isNexoraActive } = useColorPalette()
const { consentLocale } = useAppConsent()

loadAnalyticsIfConsented()
</script>

<template>
  <div :class="['flex min-h-screen flex-col bg-background', { 'nexora-canvas': isNexoraActive }]">
    <AppHeader />
    <main class="flex-1">
      <RouterView />
    </main>
    <AppFooter />
    <CookieConsentBanner :locale="consentLocale" />
  </div>
</template>
