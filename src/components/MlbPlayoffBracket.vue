<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MlbBracketMatchup from '@/components/MlbBracketMatchup.vue'
import MlbLeagueBracket from '@/components/MlbLeagueBracket.vue'
import { Badge } from '@/components/ui/badge'
import { shortTeamName } from '@onlyzoran/win-predict-ai-ui'
import { buildMlbPlayoffBracket } from '@/lib/mlbPlayoffBracket'
import type { TeamProbability } from '@/types/league'
import { formatPercent } from '@/lib/utils'

const props = defineProps<{
  teams: TeamProbability[]
}>()

const { t } = useI18n()

const bracket = computed(() => buildMlbPlayoffBracket(props.teams))
</script>

<template>
  <section v-if="bracket" class="w-full min-w-0">
    <div class="mb-5 space-y-1">
      <h3 class="text-base font-semibold leading-none">{{ t('playoff.title') }}</h3>
      <p class="text-sm text-muted-foreground">{{ t('playoff.subtitle') }}</p>
    </div>

    <!-- Mobile / tablet: vertical league rounds, no horizontal scroll -->
    <div class="space-y-8 xl:hidden">
      <MlbLeagueBracket :bracket="bracket.al" layout="vertical" />

      <div class="w-full rounded-lg border border-border bg-card px-4 py-5 shadow-sm">
        <p
          class="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {{ t('playoff.worldSeries') }}
        </p>
        <MlbBracketMatchup :matchup="bracket.worldSeries" :tbd-label="t('playoff.tbd')" />
        <div v-if="bracket.winner" class="mt-4 border-t border-border pt-4 text-center">
          <p class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {{ t('playoff.winner') }}
          </p>
          <p class="mt-1 text-sm font-semibold" :title="bracket.winner.name">
            <span class="md:hidden">{{ shortTeamName(bracket.winner.name) }}</span>
            <span class="hidden md:inline">{{ bracket.winner.name }}</span>
          </p>
          <Badge variant="secondary" class="mt-2">
            {{ formatPercent(bracket.winner.winProbability) }}
          </Badge>
        </div>
      </div>

      <MlbLeagueBracket :bracket="bracket.nl" layout="vertical" />
    </div>

    <!-- Wide desktop: full-width mirrored AL | WS | NL -->
    <div class="hidden w-full items-stretch gap-4 xl:flex 2xl:gap-6">
      <MlbLeagueBracket :bracket="bracket.al" class="min-w-0 flex-[3]" />

      <div
        class="flex w-[12rem] shrink-0 flex-col justify-center self-center rounded-lg border border-border bg-card px-3 py-5 shadow-sm 2xl:w-[14rem]"
      >
        <p
          class="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {{ t('playoff.worldSeries') }}
        </p>
        <MlbBracketMatchup :matchup="bracket.worldSeries" :tbd-label="t('playoff.tbd')" />
        <div v-if="bracket.winner" class="mt-4 border-t border-border pt-4 text-center">
          <p class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {{ t('playoff.winner') }}
          </p>
          <p class="mt-1 text-sm font-semibold" :title="bracket.winner.name">
            <span class="md:hidden">{{ shortTeamName(bracket.winner.name) }}</span>
            <span class="hidden md:inline">{{ bracket.winner.name }}</span>
          </p>
          <Badge variant="secondary" class="mt-2">
            {{ formatPercent(bracket.winner.winProbability) }}
          </Badge>
        </div>
      </div>

      <MlbLeagueBracket :bracket="bracket.nl" mirror class="min-w-0 flex-[3]" />
    </div>
  </section>
</template>
