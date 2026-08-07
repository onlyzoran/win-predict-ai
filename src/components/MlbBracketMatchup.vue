<script setup lang="ts">
import type { BracketMatchup, BracketTeam } from '@/lib/mlbPlayoffBracket'
import { shortTeamName } from '@/lib/mlbPlayoffBracket'
import { cn, formatPercent } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    matchup: BracketMatchup
    tbdLabel?: string
  }>(),
  {
    tbdLabel: 'TBD',
  },
)

function isWinner(team: BracketTeam | null): boolean {
  return Boolean(team && props.matchup.winner && team.id === props.matchup.winner.id)
}

function displayName(team: BracketTeam | null): string {
  if (!team) {
    return props.tbdLabel
  }

  return shortTeamName(team.name)
}
</script>

<template>
  <div class="w-full min-w-0 rounded-md border border-border bg-card text-card-foreground shadow-sm">
    <div
      v-for="(side, index) in [matchup.higher, matchup.lower]"
      :key="`${matchup.id}-${index}`"
      class="flex items-center gap-2 px-2.5 py-2 text-sm"
      :class="[
        index === 0 ? 'border-b border-border' : undefined,
        isWinner(side) ? 'bg-muted/50 font-semibold text-foreground' : 'text-muted-foreground',
      ]"
    >
      <span
        class="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold tabular-nums text-foreground"
      >
        {{ side?.seed ?? '—' }}
      </span>
      <span class="min-w-0 flex-1 truncate" :title="side?.name ?? tbdLabel">
        {{ displayName(side) }}
      </span>
      <span
        v-if="side"
        :class="
          cn(
            'shrink-0 text-xs tabular-nums',
            isWinner(side) ? 'text-foreground' : 'text-muted-foreground',
          )
        "
      >
        {{ formatPercent(side.winProbability) }}
      </span>
    </div>
  </div>
</template>
