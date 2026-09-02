<script setup lang="ts">
import TeamProbabilityList from '@/components/TeamProbabilityList.vue'
import TeamProbabilityListSkeleton from '@/components/TeamProbabilityListSkeleton.vue'
import type { LeagueSlot, SelectedLeague } from '@/types/league'

defineProps<{
  slotItem: LeagueSlot
  pinnedIds: string[]
  editMode: boolean
}>()

const emit = defineEmits<{
  pin: [id: string, pinned: boolean]
  hide: [id: string]
  preview: [league: SelectedLeague]
}>()
</script>

<template>
  <div class="w-72 min-w-72">
    <TeamProbabilityList
      v-if="slotItem.league"
      :id="slotItem.league.id"
      :title="slotItem.league.title"
      :full-title="slotItem.league.fullTitle"
      :teams="slotItem.league.teams"
      :progress="slotItem.league.progress"
      :start-date="slotItem.league.startDate"
      :end-date="slotItem.league.endDate"
      :icon="slotItem.league.icon"
      :pinned="pinnedIds.includes(slotItem.league.id)"
      :edit-mode="editMode"
      @pin="(id, pinned) => emit('pin', id, pinned)"
      @hide="(id) => emit('hide', id)"
      @preview="(league) => emit('preview', league)"
    />
    <TeamProbabilityListSkeleton v-else />
  </div>
</template>
