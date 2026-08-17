<script setup lang="ts">
import { LocaleSwitcher, ThemeToggle } from '@onlyzoran/win-predict-ai-ui'
import { IconBrandGithub, IconLogin } from '@onlyzoran/win-predict-ai-icons'
import { IconPalette } from '@tabler/icons-vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { locale, localeLabels, locales, setLocale, type Locale } from '@/i18n'

const { t } = useI18n()

function onLocaleUpdate(code: string) {
  if (locales.includes(code as Locale)) setLocale(code as Locale)
}
</script>

<template>
  <header
    class="fixed top-0 right-0 left-0 z-50 flex h-14 items-center justify-between border-b bg-background/80 px-6 shadow-sm backdrop-blur-md"
  >
    <div class="min-w-0">
      <RouterLink to="/" class="font-semibold text-foreground hover:opacity-80">
        {{ t('app.title') }}
      </RouterLink>
    </div>
    <div class="flex items-center gap-1">
      <LocaleSwitcher
        :model-value="locale"
        :locales="locales"
        :labels="localeLabels"
        :aria-label="t('language.label')"
        @update:model-value="onLocaleUpdate"
      />
      <ThemeToggle
        :aria-label-light="t('theme.switchToLight')"
        :aria-label-dark="t('theme.switchToDark')"
      />
      <RouterLink
        to="/settings/appearance"
        class="inline-flex items-center gap-1.5 rounded-md p-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:px-2 sm:py-1.5"
        :aria-label="t('appearance.openSettings')"
      >
        <IconPalette :size="16" aria-hidden="true" />
        <span class="hidden sm:inline">{{ t('appearance.shortLabel') }}</span>
      </RouterLink>
      <span class="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <a
        href="https://github.com/onlyzoran/win-predict-ai"
        target="_blank"
        rel="noreferrer"
        class="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="GitHub"
      >
        <IconBrandGithub :size="16" aria-hidden="true" />
      </a>
      <a
        href="http://202.71.15.138"
        target="_blank"
        rel="noreferrer"
        class="inline-flex items-center gap-1.5 rounded-md p-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:px-2 sm:py-1.5"
        :aria-label="t('auth.login')"
      >
        <IconLogin :size="16" aria-hidden="true" />
        <span class="hidden sm:inline">{{ t('auth.login') }}</span>
      </a>
    </div>
  </header>
</template>
