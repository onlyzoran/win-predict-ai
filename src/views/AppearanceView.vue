<script setup lang="ts">
import { IconArrowLeft, IconPalette } from '@onlyzoran/win-predict-ai-icons'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import MatchResultCards from '@/components/MatchResultCards.vue'
import {
  COLOR_PALETTES,
  type ColorPalette,
  palettePreferences,
  useColorPalette,
} from '@/composables/useColorPalette'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DEMO_MATCH_RESULT_CARDS } from '@/dev-fixtures/matchResults'
import { cn } from '@/lib/utils'

const { t } = useI18n()
const { activePalette } = useColorPalette()

function selectLightPalette(palette: ColorPalette) {
  palettePreferences.value = { ...palettePreferences.value, light: palette }
}

function selectDarkPalette(palette: ColorPalette) {
  palettePreferences.value = { ...palettePreferences.value, dark: palette }
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl px-4 py-8 pt-20 sm:px-6 lg:max-w-4xl">
    <RouterLink
      to="/"
      class="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <IconArrowLeft :size="16" aria-hidden="true" />
      {{ t('appearance.back') }}
    </RouterLink>

    <div class="mb-8 flex items-start gap-3">
      <div
        class="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-card text-muted-foreground"
      >
        <IconPalette :size="20" aria-hidden="true" />
      </div>
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">
          {{ t('appearance.title') }}
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ t('appearance.subtitle') }}
        </p>
        <p class="mt-2 text-sm text-muted-foreground">
          {{ t('appearance.defaultsNote') }}
        </p>
      </div>
    </div>

    <div class="space-y-8">
      <section>
        <h2 class="mb-1 text-sm font-medium text-foreground">{{ t('appearance.lightMode') }}</h2>
        <p class="mb-4 text-sm text-muted-foreground">{{ t('appearance.lightModeHint') }}</p>
        <div class="grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            v-for="palette in COLOR_PALETTES"
            :key="`light-${palette}`"
            type="button"
            class="h-full w-full text-left"
            :aria-pressed="palettePreferences.light === palette"
            @click="selectLightPalette(palette)"
          >
            <Card
              :class="
                cn(
                  'palette-option-card h-full transition-colors hover:border-ring/50',
                  palettePreferences.light === palette && 'border-primary ring-2 ring-ring/30',
                )
              "
            >
              <CardHeader class="pb-3">
                <CardTitle class="text-base">{{ t(`appearance.palettes.${palette}.name`) }}</CardTitle>
                <CardDescription>{{ t(`appearance.palettes.${palette}.description`) }}</CardDescription>
              </CardHeader>
              <CardContent class="mt-auto">
                <div
                  :data-palette="palette"
                  class="palette-preview-swatch overflow-hidden rounded-lg border"
                >
                  <div class="flex h-16 bg-background">
                    <div class="flex flex-1 flex-col justify-end gap-1 p-2">
                      <div class="h-2 w-12 rounded-sm bg-foreground/80" />
                      <div class="h-1.5 w-20 rounded-sm bg-muted-foreground/50" />
                    </div>
                    <div class="w-10 bg-primary" />
                  </div>
                  <div class="flex gap-1 border-t bg-card p-2">
                    <span class="size-2 rounded-full bg-chart-1" />
                    <span class="size-2 rounded-full bg-chart-2" />
                    <span class="size-2 rounded-full bg-chart-3" />
                    <span class="size-2 rounded-full bg-chart-4" />
                    <span class="size-2 rounded-full bg-chart-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        </div>
      </section>

      <section>
        <h2 class="mb-1 text-sm font-medium text-foreground">{{ t('appearance.darkMode') }}</h2>
        <p class="mb-4 text-sm text-muted-foreground">{{ t('appearance.darkModeHint') }}</p>
        <div class="grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            v-for="palette in COLOR_PALETTES"
            :key="`dark-${palette}`"
            type="button"
            class="h-full w-full text-left"
            :aria-pressed="palettePreferences.dark === palette"
            @click="selectDarkPalette(palette)"
          >
            <Card
              :class="
                cn(
                  'palette-option-card h-full transition-colors hover:border-ring/50',
                  palettePreferences.dark === palette && 'border-primary ring-2 ring-ring/30',
                )
              "
            >
              <CardHeader class="pb-3">
                <CardTitle class="text-base">{{ t(`appearance.palettes.${palette}.name`) }}</CardTitle>
                <CardDescription>{{ t(`appearance.palettes.${palette}.description`) }}</CardDescription>
              </CardHeader>
              <CardContent class="mt-auto">
                <div
                  :data-palette="palette"
                  class="palette-preview-swatch dark overflow-hidden rounded-lg border"
                >
                  <div class="flex h-16 bg-background">
                    <div class="flex flex-1 flex-col justify-end gap-1 p-2">
                      <div class="h-2 w-12 rounded-sm bg-foreground/80" />
                      <div class="h-1.5 w-20 rounded-sm bg-muted-foreground/50" />
                    </div>
                    <div class="w-10 bg-primary" />
                  </div>
                  <div class="flex gap-1 border-t bg-card p-2">
                    <span class="size-2 rounded-full bg-chart-1" />
                    <span class="size-2 rounded-full bg-chart-2" />
                    <span class="size-2 rounded-full bg-chart-3" />
                    <span class="size-2 rounded-full bg-chart-4" />
                    <span class="size-2 rounded-full bg-chart-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        </div>
      </section>

      <section class="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
        <div>
          <h2 class="text-sm font-medium text-foreground">
            {{ t('appearance.resultPreview.title') }}
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ t('appearance.resultPreview.subtitle') }}
          </p>
          <p
            v-if="activePalette !== 'pastel'"
            class="mt-2 text-sm text-muted-foreground"
          >
            {{ t('appearance.resultPreview.pastelHint') }}
          </p>
        </div>

        <div class="flex flex-wrap gap-3 text-xs">
          <span
            class="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2.5 py-1.5 text-muted-foreground"
          >
            <span class="size-2.5 rounded-sm bg-chart-1" aria-hidden="true" />
            {{ t('appearance.resultPreview.legendFinal') }}
          </span>
          <span
            class="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2.5 py-1.5 text-muted-foreground"
          >
            <span class="size-2.5 rounded-sm bg-chart-2" aria-hidden="true" />
            {{ t('appearance.resultPreview.legendIntermediate') }}
          </span>
        </div>

        <MatchResultCards :cards="DEMO_MATCH_RESULT_CARDS" />
      </section>
    </div>
  </div>
</template>
