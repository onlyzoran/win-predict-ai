<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { shortTeamName, StandingsGlossary } from '@onlyzoran/win-predict-ai-ui'
import type { FactsColumnKey } from '@/lib/factsTable'
import { formatFactsCell, resolveFactsColumns, sortFactsRows } from '@/lib/factsTable'
import { isFootballSport, resolveFootballFactsGlossary } from '@/lib/factsGlossary'
import type { Sport } from '@/types/sport'
import type { TournamentFactsSnapshot } from '@/types/league'
import { locale } from '@/i18n'
import { formatDate } from '@/lib/utils'

const props = defineProps<{
  snapshot: TournamentFactsSnapshot
  sport?: Sport
}>()

const { t } = useI18n()

const sortedRows = computed(() => sortFactsRows(props.snapshot.rows))
const columns = computed(() => resolveFactsColumns(props.snapshot.rows, props.snapshot.metric))
const showFootballGlossary = computed(() => isFootballSport(props.sport))
const glossaryEntries = computed(() => resolveFootballFactsGlossary(t))

const asOfDate = computed(() =>
  formatDate(props.snapshot.fetchedAt ?? props.snapshot.date, locale.value),
)

function columnLabel(key: FactsColumnKey): string {
  return t(`facts.columns.${key}`)
}

function cellClass(key: FactsColumnKey): string {
  if (key === 'team') {
    return 'truncate py-2 pr-3 font-medium'
  }

  if (key === 'rank') {
    return 'py-2 text-center tabular-nums text-muted-foreground'
  }

  return 'py-2 text-center tabular-nums text-muted-foreground'
}

function headerClass(key: FactsColumnKey): string {
  if (key === 'team') {
    return 'pb-2 pr-3 text-left font-medium'
  }

  return 'pb-2 text-center font-medium'
}
</script>

<template>
  <div class="space-y-3">
    <div class="overflow-x-auto">
      <table class="w-full min-w-[28rem] border-collapse text-sm">
        <thead>
          <tr class="text-xs font-medium text-muted-foreground">
            <th
              v-for="column in columns"
              :key="column.key"
              :class="headerClass(column.key)"
            >
              {{ columnLabel(column.key) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in sortedRows"
            :key="row.participantId ?? row.team"
            class="border-border"
            :class="index < sortedRows.length - 1 ? 'border-b' : undefined"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="cellClass(column.key)"
            >
              <template v-if="column.key === 'team'">
                <span :title="row.team">
                  <span class="md:hidden">{{ shortTeamName(row.team) }}</span>
                  <span class="hidden md:inline">{{ row.team }}</span>
                </span>
              </template>
              <template v-else>
                {{ formatFactsCell(row, column.key) }}
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <StandingsGlossary v-if="showFootballGlossary" :entries="glossaryEntries" />

    <p class="text-xs text-muted-foreground">
      {{ t('facts.asOf', { date: asOfDate }) }}
    </p>
  </div>
</template>
