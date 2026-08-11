<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { IconArrowLeft } from '@onlyzoran/win-predict-ai-icons'
import TournamentDetails from '@/components/TournamentDetails.vue'
import { Button } from '@/components/ui/button'
import { useLeague } from '@/composables/useLeague'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const leagueId = computed(() => String(route.params.id ?? ''))
const { league, isLoading, notFound, loadError } = useLeague(leagueId)

function goBack() {
  router.push({ name: 'home' })
}
</script>

<template>
  <main class="mx-auto flex w-full flex-1 flex-col px-4 py-6 pt-20">
    <div class="mx-auto w-full max-w-6xl">
      <Button variant="ghost" size="sm" class="mb-4 w-fit cursor-pointer gap-1.5" @click="goBack">
        <IconArrowLeft class="size-4" />
        {{ t('team.back') }}
      </Button>

      <p v-if="isLoading" class="text-sm text-muted-foreground">{{ t('data.loading') }}</p>
      <p v-else-if="loadError" class="text-sm text-destructive">
        {{ t('data.error') }}: {{ loadError }}
      </p>
      <p v-else-if="notFound" class="text-sm text-muted-foreground">{{ t('team.notFound') }}</p>
    </div>

    <TournamentDetails
      v-if="league && !isLoading && !loadError && !notFound"
      :title="league.title"
      :full-title="league.fullTitle"
      :teams="league.teams"
      :progress="league.progress"
      :start-date="league.startDate"
      :end-date="league.endDate"
      :icon="league.icon"
      :league-id="league.id"
      :layout="league.layout"
      :contest-path="league.contestPath"
      show-chart
    />
  </main>
</template>
