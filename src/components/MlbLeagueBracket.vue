<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MlbBracketMatchup from '@/components/MlbBracketMatchup.vue'
import type { LeagueBracket } from '@/lib/mlbPlayoffBracket'

const props = defineProps<{
  bracket: LeagueBracket
  /** Mirror column order for NL on wide desktop (CS ← DS ← WC) */
  mirror?: boolean
  /** Stretch columns across available width */
  fluid?: boolean
}>()

const { t } = useI18n()

const divisionLabel = computed(() =>
  props.bracket.league === 'al' ? t('playoff.alds') : t('playoff.nlds'),
)
const championshipLabel = computed(() =>
  props.bracket.league === 'al' ? t('playoff.alcs') : t('playoff.nlcs'),
)

const columns = computed(() => {
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
    <div class="flex gap-3 sm:gap-4" :class="fluid ? 'w-full' : 'w-max justify-center'">
      <div
        v-for="column in columns"
        :key="column.key"
        class="flex min-w-[9.5rem] flex-col"
        :class="fluid ? 'min-w-0 flex-1' : 'w-[10.5rem] shrink-0'"
      >
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
