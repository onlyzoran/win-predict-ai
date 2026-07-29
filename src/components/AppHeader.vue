<script setup lang="ts">
import { computed } from 'vue'
import { useColorMode } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { locale, toggleLocale } from '@/i18n'

const { t } = useI18n()

const nextLocale = computed(() => (locale.value === 'en' ? 'ru' : 'en'))

const mode = useColorMode()
const isDark = computed(() => mode.value === 'dark')

function toggleTheme() {
  mode.value = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50 px-6 h-14 flex items-center justify-between border-b bg-background/80 backdrop-blur-md shadow-sm">
    <span class="font-semibold text-foreground">{{ t('app.title') }}</span>
    <div class="flex items-center gap-1">
      <button
        @click="toggleLocale"
        class="rounded-md px-2 py-1 text-sm font-medium uppercase text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        :aria-label="t('language.switch')"
      >
        {{ nextLocale }}
      </button>
      <button
        @click="toggleTheme"
        class="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        :aria-label="isDark ? t('theme.switchToLight') : t('theme.switchToDark')"
      >
        <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
        </svg>
      </button>
    </div>
  </header>
</template>
