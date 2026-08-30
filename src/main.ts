import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import './assets/main.css'

import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import { createQueryClient } from '@/lib/queryClient'

const app = createApp(App)
const queryClient = createQueryClient()

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(VueQueryPlugin, { queryClient })

app.mount('#app')
