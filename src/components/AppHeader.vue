<script setup lang="ts">
import { computed } from 'vue'
import { IconMoon, IconSun } from '@tabler/icons-vue'
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
          <IconMoon v-if="isDark" class="size-3.5" stroke-width="2" />
          <IconSun v-else class="size-3.5" stroke-width="2" />
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.38 7.86 10.9.57.1.78-.25.78-.55 0-.27-.01-1.15-.02-2.08-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.27 1.19-3.07-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.17a10.9 10.9 0 0 1 5.78 0c2.2-1.49 3.17-1.17 3.17-1.17.63 1.58.23 2.75.11 3.04.74.8 1.19 1.82 1.19 3.07 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.08.78 2.18 0 1.58-.01 2.85-.01 3.24 0 .3.2.66.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
          />
        </svg>
      </a>
      <span class="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <a
        href="https://onlyzoran.github.io/win-predict-ai-admin"
        target="_blank"
        rel="noreferrer"
        class="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" x2="3" y1="12" y2="12" />
        </svg>
        <span>{{ t('auth.login') }}</span>
      </a>
    </div>
  </header>
</template>
