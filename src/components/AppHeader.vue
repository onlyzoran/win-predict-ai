<script setup lang="ts">
import { AppHeaderShell } from '@onlyzoran/win-predict-ai-ui'
import { IconLogin } from '@onlyzoran/win-predict-ai-icons'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { locale, localeLabels, locales, setLocale, type Locale } from '@/i18n'

const { t } = useI18n()

function onLocaleUpdate(code: string) {
  if (locales.includes(code as Locale)) setLocale(code as Locale)
}
</script>

<template>
  <AppHeaderShell
    :locale="locale"
    :locales="locales"
    :locale-labels="localeLabels"
    :locale-aria-label="t('language.label')"
    :theme-aria-label-light="t('theme.switchToLight')"
    :theme-aria-label-dark="t('theme.switchToDark')"
    github-url="https://github.com/onlyzoran/win-predict-ai"
    @update:locale="onLocaleUpdate"
  >
    <template #brand>
      <RouterLink to="/" class="font-semibold text-foreground hover:opacity-80">
        {{ t('app.title') }}
      </RouterLink>
    </template>
    <template #actions>
      <a
        href="https://onlyzoran.github.io/win-predict-ai-admin"
        target="_blank"
        rel="noreferrer"
        class="inline-flex items-center gap-1.5 rounded-md p-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:px-2 sm:py-1.5"
        :aria-label="t('auth.login')"
      >
        <IconLogin :size="16" aria-hidden="true" />
        <span class="hidden sm:inline">{{ t('auth.login') }}</span>
      </a>
    </template>
  </AppHeaderShell>
</template>
