<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const version = __APP_VERSION__
</script>

<template>
  <footer class="mt-auto border-t border-border/60 py-4">
    <div class="container mx-auto px-4 text-right text-xs text-muted-foreground">
      {{ t('app.version', { version }) }}
    </div>
  </footer>
</template>
