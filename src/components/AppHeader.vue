<script setup lang="ts">
import { computed } from 'vue'
import { IconBrandGithub, IconLogin, IconMoon, IconSun } from '@onlyzoran/win-predict-ai-icons'
import { RouterLink } from 'vue-router'
import { useColorMode } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { locale, localeLabels, locales, setLocale, type Locale } from '@/i18n'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const { t } = useI18n()

const mode = useColorMode({
  modes: {
    auto: '',
    light: '',
    dark: 'dark',
  },
})
const isDark = computed(() => mode.state.value === 'dark')

function toggleTheme() {
  mode.value = isDark.value ? 'light' : 'dark'
}

function onLocaleChange(value: string | number | bigint | Record<string, unknown> | null) {
  if (typeof value === 'string' && locales.includes(value as Locale)) {
    setLocale(value as Locale)
  }
}
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 px-6 h-14 flex items-center justify-between border-b bg-background/80 backdrop-blur-md shadow-sm"
  >
    <RouterLink to="/" class="font-semibold text-foreground hover:opacity-80">
      {{ t('app.title') }}
    </RouterLink>
    <div class="flex items-center gap-1">
      <DropdownMenu :modal="false">
        <DropdownMenuTrigger
          class="rounded-md px-2 py-1 text-sm font-medium uppercase text-muted-foreground hover:text-foreground hover:bg-accent transition-colors outline-none focus-visible:ring-ring/50 focus-visible:ring-3"
          :aria-label="t('language.label')"
        >
          {{ locale }}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup :model-value="locale" @update:model-value="onLocaleChange">
            <DropdownMenuRadioItem v-for="code in locales" :key="code" :value="code">
              <span class="w-6 uppercase text-muted-foreground">{{ code }}</span>
              {{ localeLabels[code] }}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        @click="toggleTheme"
        class="relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        :class="
          isDark
            ? 'border-zinc-700 bg-zinc-800 text-zinc-100'
            : 'border-zinc-300 bg-zinc-100 text-zinc-500'
        "
        :aria-label="isDark ? t('theme.switchToLight') : t('theme.switchToDark')"
      >
        <span
          class="pointer-events-none absolute top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full transition-[left,right,background-color,color,box-shadow] duration-200"
          :class="
            isDark
              ? 'right-0.5 left-auto bg-zinc-950 text-white shadow-[0_2px_10px_rgba(0,0,0,0.35)]'
              : 'left-0.5 right-auto bg-white text-zinc-500 shadow-[0_2px_8px_rgba(15,23,42,0.18)]'
          "
        >
          <IconMoon v-if="isDark" class="size-3.5" :stroke="2" />
          <IconSun v-else class="size-3.5" :stroke="2" />
        </span>
      </button>
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
      <span class="mx-1 h-5 w-px bg-border" aria-hidden="true" />
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
    </div>
  </header>
</template>
