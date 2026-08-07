<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MlbBracketMatchup from '@/components/MlbBracketMatchup.vue'
import type { LeagueBracket } from '@/lib/mlbPlayoffBracket'

const props = withDefaults(
  defineProps<{
    bracket: LeagueBracket
    /** Mirror column order for NL on wide desktop (CS ← DS ← WC) */
    mirror?: boolean
    /** Vertical rounds (mobile) vs side-by-side columns (desktop) */
    layout?: 'horizontal' | 'vertical'
  }>(),
  {
    mirror: false,
    layout: 'horizontal',
  },
)

const { t } = useI18n()

const divisionLabel = computed(() =>
  props.bracket.league === 'al' ? t('playoff.alds') : t('playoff.nlds'),
)
const championshipLabel = computed(() =>
  props.bracket.league === 'al' ? t('playoff.alcs') : t('playoff.nlcs'),
)

const rounds = computed(() => {
  const cols = [
    {
      key: 'wc',
      label: t('playoff.wildCard'),
      matchups: props.bracket.wildCard,
    },
    {
      key: 'ds',
      label: divisionLabel.value,
      matchups: props.bracket.divisionSeries,
    },
    {
      key: 'cs',
      label: championshipLabel.value,
      matchups: [props.bracket.championshipSeries],
    },
  ]

  return props.mirror ? [...cols].reverse() : cols
})
</script>

<template>
  <div class="w-full min-w-0">
    <h4 class="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {{ bracket.league === 'al' ? t('playoff.americanLeague') : t('playoff.nationalLeague') }}
    </h4>

    <!-- Mobile: rounds stacked full-width -->
    <div v-if="layout === 'vertical'" class="space-y-5">
      <div v-for="round in rounds" :key="round.key" class="space-y-2">
        <p
          class="text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
        >
          {{ round.label }}
        </p>
        <div
          class="grid gap-2"
          :class="round.matchups.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'"
        >
          <MlbBracketMatchup
            v-for="matchup in round.matchups"
            :key="matchup.id"
            :matchup="matchup"
            :tbd-label="t('playoff.tbd')"
          />
        </div>
      </div>
    </div>

    <!-- Desktop: side-by-side columns, fluid width -->
    <div v-else class="flex w-full gap-3 sm:gap-4">
      <div v-for="column in rounds" :key="column.key" class="flex min-w-0 flex-1 flex-col">
        <p
          class="mb-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
        >
          {{ column.label }}
        </p>
        <div
          class="flex flex-1 flex-col gap-4"
          :class="column.matchups.length === 1 ? 'justify-center' : 'justify-between'"
        >
          <MlbBracketMatchup
            v-for="matchup in column.matchups"
            :key="matchup.id"
            :matchup="matchup"
            :tbd-label="t('playoff.tbd')"
          />
        </div>
      </div>
    </div>
  </div>
</template>
